$.ajaxSetup({
    cache: false,
    beforeSend: function(xhr, settings) {
        if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", _csrf);
        }
    }
});

window.serialize = function(obj) {
  var str = [];
  for(var p in obj){
     if($.isArray(obj[p])){
         for(var i in obj[p]){
             str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p][i]));
         }
     }else{
         str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
     }
  }
  return str.join("&");
}

/* adapted from unscriptable's method */
var _debounce = function (func, threshold, execAsap) {
    var _timeout;
    return function debounced () {
        var obj = this, args = arguments;
        function delayed () {
            if (!execAsap)
                func.apply(obj, args);
            _timeout = null; 
        };
        if (_timeout)
            clearTimeout(_timeout);
        else if (execAsap)
            func.apply(obj, args);
        _timeout = setTimeout(delayed, threshold || 100); 
    }; 
}

Backbone.pubSub = _.extend({}, Backbone.Events);
var templates = {};

$('script[type="underscore/template"]').each(function(){
    templates[$(this).attr("id")] = _.template($(this).text());
}); 

var SLIDER_TEXTS = {
    'upbeat':     ['Very Mellow',
                   'More Mellow',
                   'No Preference',
                   'More Upbeat',
                   'Very Upbeat' ],
    'familiar':   ['Very Obscure',
                   'More Obscure',
                   'No Preference',
                   'More Familiar',
                   'Very Familiar' ],
    'buzz':       ['Very Quiet',
                   'More Quiet',
                   'No Preference',
                   'More Buzzing',
                   'Very Buzzing' ],
    'electric':   ['Very Electric',
                   'More Electric',
                   'No Preference',
                   'More Acoustic',
                   'Very Acoustic' ],
    'adventurous': ['Very Adventurous',
                   'More Adventurous',
                   'No Preference',
                   'More Conservative',
                   'Very Conservative' ],
    'artist-hot': ['Very Cold',
                   'Colder',
                   'No Preference',
                   'Hottter',
                   'Very Hot' ],
    'song-hot':   ['Very Cold',
                   'Colder',
                   'No Preference',
                   'Hottter',
                   'Very Hottt' ],
    'decade':     ['1970s',
                   '1980s',
                   '1990s',
                   '2000s',
                   '2010s'],
    'holiday':    ['Allowed',
                   'Disallowed',
                   'Only Include'],
    'live':       ['Allowed',
                   'Disallowed',
                   'Only Include'],
    'length-min': ['0 minutes',
                   '1 minutes',
                   '2 minutes',
                   '3 minutes',
                   '4 minutes',
                   '5 minutes'],
    'length-max': ['4 minutes',
                   '5 minutes',
                   '6 minutes',
                   '7 minutes',
                   '8 minutes',
                   '9 minutes',
                   '10 minutes']};

var CommonView = Backbone.View.extend({
    getCurrentSeed: function(){
        var type = this.model.get('currentType');
        console.log(type);
        if(type === 'artist' || type === 'track'){
            return _.filter(this.model.get(type + 'Seeds', []), function(el){return el !== null});
        }else if(type === 'genre'){
            return this.model.get('genreSeeds', []);
        }else if(type === 'playlist'){
            return this.model.get('playlistSeed', []);
        }
    }
});

var NavigationView = CommonView.extend({
    el: $('body'),
    _loading: false,
    currentNav: 'topbar-nav-input',
    seenRefine: false,
    startX: 0,
    keyEvents: {
        37: 'navPrevious',
        39: 'navNext'
    },
    navOrder: [
        'topbar-nav-input',
        'topbar-nav-seed',
        'topbar-nav-filter',
        'topbar-nav-refine'
    ],
    boards: {
        'topbar-nav-input': '#type-board',
        'topbar-nav-seed': '#seeds-board',
        'topbar-nav-filter': '#filter-board'
    },
    events: {
        'click div.topbar-nav-btn': 'selectNav',
        'click div#nav-next:not(.disabled)': 'navNext',
        'click div#nav-previous:not(.disabled)': 'navPrevious',
        'touchstart .base': 'touchStart',
        'touchmove .base': 'touchMove',
        'touchend .base': 'touchEnd',
        'keyup': 'navKey'
    },

    initialize: function(){
        Backbone.pubSub.on('resetSideNav', this.resetSideNav, this);  
    },

    reset: function(){
        this.navChange('topbar-nav-input');
        $('#base-right').html(_.template($('#playlist-view-artists-empty').text(), {}));
        $('.seed-type.selected').removeClass('selected');
        $('.billboard').html(templates['billboard-main']);
        $('#pl-hour').text('2');
        $('#pl-minute').text('0');
    },

    selectNav: function(ev){
        this.navChange($(ev.currentTarget).attr('id'));
    },

    navNext: function(ev){
        var i = _.indexOf(this.navOrder, this.currentNav);
        if(i < 3){
            this.navChange(this.navOrder[i+1]);
        }
    },

    navPrevious: function(ev){
        var i = _.indexOf(this.navOrder, this.currentNav);
        if(i > 0){
            this.navChange(this.navOrder[i-1]);
        }
    },

    navKey: function(ev){
        if($("input,textarea").is(":focus")) return;
        if(ev.keyCode === 37) this.navPrevious(ev);
        else if(ev.keyCode === 39) this.navNext(ev);
    },

    touchStart: function(ev){
        if(ev.changedTouches.length == 1){
            var touch = ev.changedTouches[0];
            this.startX = touch.pageX;
        }
    },

    touchEnd: function(ev){
        if(ev.changedTouches.length == 1){
            var touch = ev.changedTouches[0];
            if (touch.pageX - this.startX > 300){
                this.navNext(ev);
            }else if(touch.pageX - this.startX < -300){
                this.navPrevious(ev);
            }
        }
    },

    changeSelection: function(id){
        // changeSelection by ID
        var id = this.currentNav;
        $('.topbar-nav-btn').removeClass('active');
        $('.topbar-nav-btn').removeClass('done');
        $('.topbar-nav-wirebox').removeClass('active');
        $('.topbar-nav-lbl').removeClass('active');
        $('#'+id).addClass('active');
        $('#'+id).prevAll('.topbar-nav-btn').addClass('done');
        $('#'+id).prevAll('.topbar-nav-wirebox').addClass('active');
        $('.topbar-nav-lbl[data-btnid="'+$('#'+id).attr('id')+'"]').addClass('active');
        this.showBoard(this.boards[id]);
    },

    isLoading: function(){
        return this._loading;
    },

    _animNextNav: function(){
        $('#nav-next div').addClass('animated pulse');
    },

    resetSideNav: function(){
        switch(this.currentNav){
            case 'topbar-nav-input':
                $('#nav-previous').addClass('disabled');
                $('.no-collapse').addClass('narrow');
                if(this.model.get('currentType') !== null){
                    $('#nav-next').removeClass('disabled');
                    this._animNextNav();
                }else{
                    $('#nav-next').addClass('disabled');
                }
                $('#nav-next-text').html('<p>Advance to<br/><strong>Choose Seed(s)</p>');
                break;
            case 'topbar-nav-seed':
                $('#nav-previous').removeClass('disabled');
                $('.no-collapse').removeClass('narrow');
                var currSeed = this.getCurrentSeed();
                if(currSeed && (currSeed.length > 0 || ('tracks' in currSeed && currSeed.tracks.length > 0)) && !this.isLoading()){
                    $('#nav-next').removeClass('disabled');
                    this._animNextNav();
                }else{
                    $('#nav-next').addClass('disabled');
                }
                $('#nav-previous-text').html('<p>Go Back to<br/><strong>Select Input</strong></p>');
                $('#nav-next-text').html('<p>Advance to<br/><strong>Adjust Filters</strong></p>');
                break;
            case 'topbar-nav-filter':
                $('#nav-previous').removeClass('disabled');
                $('.no-collapse').removeClass('narrow');
                if(this.model.get('currentSongList') !== null && 
                   this.model.get('currentSongList').length > 0 && 
                   !this.isLoading()){
                    $('#nav-next').removeClass('disabled');
                    this._animNextNav();
                }else{
                    $('#nav-next').addClass('disabled');
                }
                $('#nav-previous-text').html('<p>Go Back to<br/><strong>Choose Seed(s)</strong></p>');
                $('#nav-next-text').html('<p>Advance to<br/><strong>Refine Playlist</strong></p>');
                break;
            case 'topbar-nav-refine':
                $('#nav-previous').removeClass('disabled');
                $('.no-collapse').removeClass('narrow');
                $('#nav-next').addClass('disabled');
                $('#nav-previous-text').html('<p>Go Back to<br/><strong>Adjust Filters</strong></p>');
                break;
        }
    },
    isAllowedNav: function(id){
        if(this.isLoading()) return false;
        allowed = ['topbar-nav-input'];
        if(this.model.get('currentType') !== null){
            allowed.push('topbar-nav-seed');
            var currSeed = this.getCurrentSeed();
            if(currSeed && (currSeed.length > 0 || ('tracks' in currSeed && currSeed.tracks.length > 0))){
                allowed.push('topbar-nav-filter');
                allowed.push('topbar-nav-refine');
            }
        }
        return _.contains(allowed, id);
    },
    _showMain: function(){
        $('#refine-app').addClass('hidden');
        $('#refine-app').css('display', 'none');
        $('#main-app').removeClass('hidden');
        $('#main-app').css('display', 'block');
    },
    _showRefine: function(){
        $('#main-app').addClass('hidden');
        $('#main-app').css('display', 'none');
        $('#refine-app').removeClass('hidden');
        $('#refine-app').css('display', 'block');
        $('#refine-board, #refine-right').css('display', 'none');
        $('#refine-board, #refine-right').fadeIn(500);
    },
    _showPlaylist: function(callb){
        $('.billboard').addClass('hidden');
        $('.billboard').css('display', 'none');
        $('.playlist').fadeIn(500, function(){
            $('.playlist').removeClass('hidden');
            if(callb) callb();
        });
    },
    _showBillboard: function(){
        $('.playlist').addClass('hidden');
        $('.playlist').css('display', 'none');
        $('.billboard').fadeIn(500, function(){
            $('.billboard').removeClass('hidden');
        });
    },
    navChange: function(id){
        var lastNav = this.currentNav, that = this;
        if(!this.isAllowedNav(id)) return;
        this.currentNav = id;
        if($('.popover').length){
            $('.drop-div, .drop-div-long').popover('hide'); 
        }
        if(id === "topbar-nav-refine"){
            Backbone.pubSub.trigger('renderRefinePlaylist');
            if(!that.seenRefine) that.seenRefine = true;
            this._showRefine();
            var refine_detail = _.template($('#refine-view').text(), {model:this.model.toJSON(),
                                                                      slider_texts:SLIDER_TEXTS});
            $('#refine-detail').html(refine_detail);
            _.each($('.refine-artist'), function(item,key,list){
                Backbone.pubSub.trigger('updateImg', item);
            });
        }else{
            if(lastNav === "topbar-nav-refine"){
                this._showMain();
            }
            if(id === "topbar-nav-filter"){
                if($('.playlist').hasClass('hidden')){
                    if(this.model.get('recalc')){
                        this._showPlaylist(function(){
                            Backbone.pubSub.trigger('displayPlaylist', false);
                        });
                    }else{
                        this._showPlaylist();
                        Backbone.pubSub.trigger('displayPlaylist', false);
                    }
                }else{
                    Backbone.pubSub.trigger('displayPlaylist');
                }
            }else if(id === "topbar-nav-input"){
                this._showBillboard();
            }else if(id === "topbar-nav-seed"){
                var currSeed = this.getCurrentSeed();
                if(currSeed && (currSeed.length > 0 || ('tracks' in currSeed && currSeed.tracks.length > 0))){
                    if($('.playlist').hasClass('hidden')){
                        this._showPlaylist();
                        Backbone.pubSub.trigger('displayArtists', false);
                    }else{
                        Backbone.pubSub.trigger('displayArtists');
                    }
                }
            }
        }
        _gaq.push([
                'trackEvent',
                'Navigation',
                'Site Nav',
                'Foobar']);
        this.changeSelection();
        this.resetSideNav();
    },
    renderSwitch: function(el, type){
        $('#seeds-board').html(templates['seeds-view-'+type]);
        $('.topbar-nav-btn').removeClass('done');
        $('.topbar-nav-btn').removeClass('active');
        $('.topbar-nav-wirebox').removeClass('active');
        $('.topbar-nav-lbl').removeClass('active');
        $(el).addClass('active');
        $(el).prevAll('.topbar-nav-btn').addClass('done');
        $(el).prevAll('.topbar-nav-wirebox').addClass('active');
        $('.topbar-nav-lbl[data-btnid="'+$(el).attr('id')+'"]').addClass('active');
        this.showBoard('#seeds-board');
    },
    resetSeedsBoard: function(type){
        var board = _.template($('#seeds-view-'+type).text(), {model: this.model.toJSON()});
        $('#seeds-board').html(board);
    },
    showBoard: function(board){
        $('.board').addClass('hidden');
        $('.board').css('display', 'none');
        $(board).fadeIn(500, function(){
            $(board).removeClass('hidden');
        });
    }
});

var RdioView = Backbone.View.extend({
    el:$('#rdio-auth'),
    render: function(){
        var that = this;
        $.get('/auth-info/', function(data){
            // render a template?
            that.$el.html(data.display+'&nbsp;&nbsp;<i class="icon-white icon-chevron-down">');
        });
    },
    initialize: function(){
        this.render();
    }
});

var SeedTypeView = Backbone.View.extend({
    el: $('#type-board'),
    events: {
        'click .seed-type': 'selectType',
        'mouseover .seed-type': 'hoverType',
        'mouseout .seed-type': 'unhoverType',
        'change #pl-length-input': 'changeLength',
        'click .drop-div': 'toggleDropDiv',
        //'mouseout .drop-div': 'closeDropDiv'
    },
    initialize: function(){
        this.render();
    },
    render: function(){
        this.$el.html(templates['select-input-view']);
        $('.drop-div').popover({container: 'body', placement: 'bottom', trigger:'manual', delay: { show: 500, hide: 100 }});
    },
    selectType: function(ev){
        var $target = $(ev.currentTarget); 
        var type = $target.data('type');
        $('.seed-type.selected').removeClass('selected');
        $('.billboard').html(templates['billboard-seed-'+type]);
        $target.addClass('selected');
        Backbone.pubSub.trigger('selectType', type);
    },
    hoverType: function(ev){
        var $target = $(ev.currentTarget); 
        var type = $target.data('type');
        $('.billboard *').stop().fadeOut(200, function(){
            $('.billboard').html(templates['billboard-seed-'+type]);
            $('.billboard *').fadeIn(200);
        });
    },
    unhoverType: function(ev){
            if($('.seed-type.selected').length){
                var type = $('.seed-type.selected').data('type');
                if(type !== $(ev.currentTarget).data('type')){
                    $('.billboard *').stop().fadeOut(200, function(){
                        $('.billboard').html(templates['billboard-seed-'+type]);
                        $('.billboard *').fadeIn(200);
                    });
                }
            }else{
                $('.billboard *').stop().fadeOut(200, function(){
                    $('.billboard').html(templates['billboard-main']);
                    $('.billboard *').fadeIn(200);
                });
            }
    },  
    changeLength: function(ev){
        $('#pl-length-val').text($(ev.currentTarget).val());
    },
    toggleDropDiv: function(ev){
        if($('.popover').length){
            $('.drop-div').popover('hide'); 
            return;
        }
        var type = $(ev.currentTarget).data('type');
        var top = $(ev.currentTarget).offset().top;
        var left = $(ev.currentTarget).offset().left;
        $(ev.currentTarget).popover('toggle');
        $('.popover-content').html(_.template($('#drop-div-'+type).text(), {}));
        $('.popover').css('top', top+51).css('left', left+60);
        $('.popover .arrow').css('left', 167);
        $('.drop-div-item').click(function(){
            if($(this).children('.val').text() !== $(ev.currentTarget).children('.pl-'+type).text()){
                Backbone.pubSub.trigger('queueRecalc');
            }
            $(ev.currentTarget).children('.pl-'+type).text($(this).children('.val').text());
            $('.drop-div').popover('hide'); 
        });
    }
});

var TypeaheadView = Backbone.View.extend({
    el: $('#seeds-typeahead-board'),
    close: function(ev){
        this.$el.addClass('hidden');
        this.$el.css('display', 'none');
        $('#seeds-board').removeClass('hidden');
        $('#seeds-board').css('display', 'block');
    }
});

var ArtistTypeaheadView = TypeaheadView.extend({
    activeIndex: 0,
    setIndex: function(ind){ this.activeIndex = ind; },
    events: {
        'input input.artist-input': 'artistTypeahead',
        'click a.artist-seed': 'artistAdd',
        'click .close-typeahead': 'close'
    },
    render: function(){
        var ret = _.template($('#seeds-typeahead-artist').text(), {});
        this.$el.html(ret);
    },
    artistTypeahead: function(ev){
        var q = $(ev.currentTarget).val();
        this.throttleTypeahead(q)
    },
    throttleTypeahead: _debounce(function(query){
            if(query === '') return;
            var results = [];
            $.get('/type/artist/?q='+query, function(data){
                results.push.apply(results, data.results);
                $('.artist-results').html(_.template($('#seeds-typeahead-artist-results').text(),
                                                     {results: _.uniq(results, function(item, key, list){ return item.id })})); 
            });
            $.get('/type/artist-search/?q='+query, function(data){
                results.push.apply(results, data.results);
                $('.artist-results').html(_.template($('#seeds-typeahead-artist-results').text(),
                                                     {results: _.uniq(results, function(item, key, list){ return item.id })})); 
            });
        }, 300),
    artistAdd: function(ev){
        var name = $(ev.currentTarget).text();
        Backbone.pubSub.trigger('updateArtistSeeds', this.activeIndex, name);
        this.$el.addClass('hidden');
        this.$el.css('display', 'none');
        $('#seeds-board').css('display', 'block');
        $('#seeds-board').removeClass('hidden');
        Backbone.pubSub.trigger('seedsChanged');
    }
});

var TrackTypeaheadView = TypeaheadView.extend({
    activeIndex: 0,
    setIndex: function(ind){ this.activeIndex = ind; },
    events: {
        'input input.track-input': 'trackTypeahead',
        'click a.track-seed': 'trackAdd',
        'click .close-typeahead': 'close'
    },
    render: function(){
        //this.$el.html(templates['seeds-typeahead-artist']);
        var ret = _.template($('#seeds-typeahead-track').text(), {});
        this.$el.html(ret);
    },
    trackTypeahead: function(ev){
        var q = $(ev.currentTarget).val();
        this.throttleTypeahead(q)
    },
    throttleTypeahead: _debounce(function(query){
        if(query === '') return;
        $.get('/type/track/?q='+query, function(data){
            $('.track-results').html(_.template($('#seeds-typeahead-track-results').text(), {results: data.results}));
        });
    }, 300),
    trackAdd: function(ev){
        var artist_name = $(ev.currentTarget).data('artist');
        var id = $(ev.currentTarget).data('id');
        var artid = $(ev.currentTarget).data('artid');
        var disp = $(ev.currentTarget).data('display');
        Backbone.pubSub.trigger('updateTrackSeeds', id, artid, disp);
        this.$el.addClass('hidden');
        this.$el.css('display', 'none');
        $('#seeds-board').removeClass('hidden');
        $('#seeds-board').css('display', 'block');
        Backbone.pubSub.trigger('seedsChanged');
    }
});

var GenreTypeaheadView = TypeaheadView.extend({
    activeIndex: 0,
    setIndex: function(ind){
        this.activeIndex = ind;
    },
    events: {
        'input input.genre-input': 'genreTypeahead',
        // event for selecting an artist - from the artist-results template
        'click a.genre-seed': 'genreAdd',
        'mouseover a.genre-seed': 'hoverGenre',
        //'mouseout a.genre-seed': 'requestArtists',
        'click .close-typeahead': 'close'
    },
    render: function(){
        var ret = _.template($('#seeds-typeahead-genre').text(), {});
        this.$el.html(ret);
    },
    genreTypeahead: function(ev){
        var q = $(ev.currentTarget).val();
        this.throttleTypeahead(q);
    },
    throttleTypeahead: _debounce(function(query){
            if(query === '') return;
            $.get('/type/genre/?q='+query, function(data){
                var newHtml = _.template($('#seeds-typeahead-genre-results').text(), {results: data.items})
                $('.genre-results').html(newHtml);
            });
        }, 300),
    genreAdd: function(ev){
        var name = $(ev.currentTarget).text();
        Backbone.pubSub.trigger('updateGenreSeeds', name);
        this.$el.addClass('hidden');
        this.$el.css('display', 'none');
        $('#seeds-board').removeClass('hidden');
        $('#seeds-board').css('display', 'block');
        Backbone.pubSub.trigger('seedsChanged');
    },
    hoverGenre: function(ev){
        var genre = $(ev.currentTarget).data('genre');
        Backbone.pubSub.trigger('expandGenre', genre);
    },
    requestArtists: function(ev){
        Backbone.pubSub.trigger('requestArtists');
    }
});

var SeedInputView = Backbone.View.extend({
    el: $('#seeds-board'),
    initialize: function(){
        this.render();
    }
});

var ArtistSeedInputView = SeedInputView.extend({
    activeIndex: null,
    events: {
        'mouseenter .artist-ctl': 'hoverArtist',
        'mouseleave .artist-ctl': 'unhoverArtist',
        'click .artist-unseed':   'artistUnseed',
        'click .artist-ctl':      'artistControl'
    },
    typeahead: new ArtistTypeaheadView(),
    render: function(){
        this.$el.html(_.template($('#seeds-view-artist').text(), {model:this.model.toJSON()}));
    },
    artistControl: function(ev){
        this.activeIndex = parseInt($(ev.currentTarget).data('index'));
        $('#seeds-board').addClass('hidden');
        $('#seeds-board').css('display', 'none'); /* because of fades */
        $('#seeds-typeahead-board').removeClass('hidden');
        $('#seeds-typeahead-board').css('display', 'block');
        this.typeahead.setIndex(this.activeIndex);
        this.typeahead.render();
        $('.artist-input').focus();
    },
    hoverArtist: function(ev){
        if(this.model.get('artistSeeds')[parseInt($(ev.currentTarget).data('index'))] !== null){
            var top = $(ev.currentTarget).offset().top, left = $(ev.currentTarget).offset().left;
            var $btn = $('<span class="artist-unseed"><i class="icon-remove icon-white"></i></span>');
            $btn.css('top', top-30).css('left', left+70);
            $(ev.currentTarget).append($btn);
            setTimeout(function(){
                $btn.animate({opacity: 1}, 100);
            }, 500);
        }
    },
    unhoverArtist: function(ev){
        $('.artist-unseed').remove();
    },
    artistUnseed: function(ev){
        var index = $(ev.currentTarget).parents('.artist-ctl').data('index');
        var currentSeeds = this.model.get('artistSeeds');
        currentSeeds[index] = null;
        this.model.set({artistSeeds: currentSeeds});
        Backbone.pubSub.trigger('updateArtistSeeds', index);
        $('.artist-unseed').remove();
        if(_.filter(currentSeeds, function(it){return it !== null}).length > 0){
            Backbone.pubSub.trigger('seedsChanged');
        }else{
            this.model.set({currentArtistList: null});
            Backbone.pubSub.trigger('resetSeedsBoard');
            Backbone.pubSub.trigger('displayArtists');
            Backbone.pubSub.trigger('resetSideNav');
        }
        ev.stopPropagation();
    },
    updateImg: function(el, index){
        var size = '93px', name = this.model.get('artistSeeds')[index];
        if(name){
            var library = this.model.get('artistImgs');
            if(name in library){
                el.src = library[name];
            }else{
                var that = this;
                $.get('/artist-img/?name='+name, function(data){
                    var url = data.url === '' ? '/static/img/logo_default.png' : data.url;
                    el.src = url;
                    $(el).attr('width', size).attr('height', size);
                    library[name] = data.url;
                    that.model.set('artistImgs', library);
                });
            }
        }else{
            el.src = '/static/img/add-btn.png';
            $(el).parents('.artist-ctl').tooltip('destroy');
        }
    }
});

var TrackSeedInputView = SeedInputView.extend({
    activeIndex: null,
    typeahead: new TrackTypeaheadView(),
    events: {
        'click .track-ctl': 'openTypeahead',
        'click div.unseed-track': 'unseedTrack'
    },
    render: function(){
        this.$el.html(_.template($('#seeds-view-track').text(), {model: this.model.toJSON()}));
    },
    renderSeeds: function(){
        this.$el.find('.track-seeds').html(_.template($('#seeds-view-track-seeds').text(), {model: this.model.toJSON()}));
    },
    openTypeahead: function(ev){
        if($(ev.target).hasClass('unseed-track')) return;
        //that.activeIndex = parseInt($(this).data('index'));
        $('#seeds-board').addClass('hidden');
        $('#seeds-board').css('display', 'none');
        $('#seeds-typeahead-board').removeClass('hidden');
        $('#seeds-typeahead-board').css('display', 'block');
        //that.typeahead.setIndex(that.activeIndex);
        this.typeahead.render();
        $('.track-input').focus();
    },
    unseedTrack: function(ev){
        var id = $(ev.currentTarget).parent('.track-ctl-seed').data('id');
        var curr = this.model.get('trackSeeds');
        curr = _.filter(curr, function(item){return item.id !== id});
        this.model.set('trackSeeds', curr);
        Backbone.pubSub.trigger('updateTrackSeeds');
        if(curr.length > 0){
            Backbone.pubSub.trigger('seedsChanged');
        }else{
            this.model.set({currentArtistList: null});
            this.render();
            Backbone.pubSub.trigger('displayArtists');
            Backbone.pubSub.trigger('resetSideNav');
        }
    },
    updateImg: function(el, index, artid){
        var id = this.model.get('trackSeeds')[index];
        $.get('/track-img/?id='+id+'&artid='+artid, function(data){
            el.src = data.url;
        });
    }
});

var PlaylistSeedInputView = SeedInputView.extend({
    userPlaylists: [],
    events: {
        'click div.pl-input-type': 'switchType',
        'click button.url-input-btn': 'sendUrl',
        'click div.rdio-playlist-icon': 'sendKey',
        'input textarea.manual-input': 'manualInput',
        'change input.file-input': 'fileInput'
    },
    trim: function(str){
        return str.replace(/^\s+|\s+$/g, ''); 
    },
    render: function(){
        var that = this;
        this.$el.html(templates['seeds-view-playlist']);
        this.$playlist = $('#input-playlist');
        $.get('/user-playlists/', function(data){
            that.userPlaylists = data.playlists;
            $('#rdio-playlists').html(_.template($('#rdio-playlists-view').text(), 
                                                  {playlists: that.userPlaylists}));
            $('.rdio-playlist-icon').tooltip({placement:'top',trigger:'hover',delay:{show:300,hide:100}});
        });
    },
    renderPlaylist: function(tracks, name){
        name = name || '';
        this.model.set({playlistSeed: {tracks: tracks, name: name}});
        this.$playlist.html(_.template($('#input-playlist-view').text(), {tracks: tracks, name: name}));
        Backbone.pubSub.trigger('seedsChanged');
    },
    switchType: function(ev){
        var type = $(ev.currentTarget).data('type');
        $('.pl-input-type').removeClass('selected');
        $(ev.currentTarget).addClass('selected');
        if(type === 'browse'){
            $('#rdio-playlists').removeClass('hidden');
        }else{
            $('#rdio-playlists').addClass('hidden');
        }
        $('#playlist-input-action').html(_.template($('#playlist-action-'+type).text(), {}));
    },
    sendUrl: function(ev){
        var that = this, url;
        this.$playlist.html(_.template($('#loading-view').text(), {}));
        url = $('#seed-playlist').val();
        $.post('/rdio-playlist-by-url/', {url: url}, function(data){
            that.renderPlaylist(data.tracks, data.name);    
        });
    },
    sendKey: function(ev){
        var that = this, key;
        key = $(ev.currentTarget).data('key');
        this.$playlist.html(_.template($('#loading-view').text(), {}));
        $.post('/rdio-playlist-by-key/', {key: key}, function(data){
            that.renderPlaylist(data.tracks, data.name);
        });
    },
    manualInput: _debounce(function(ev){
        var songs = [], txt = $(ev.currentTarget).val(), that = this, lines;
        lines = txt.split('\n')
        _.each(lines, function(item, key, list){
            var song = item.split('-');
            if(song.length === 2){
                songs.push(that.trim(song[0])+'-'+that.trim(song[1]));
            }
        });
        if(songs.length){
            this.$playlist.html(_.template($('#loading-view').text(), {}));
            $.post('/rdio-playlist-by-text/', {songs: songs.join()}, function(data){
                that.renderPlaylist(data.tracks);    
            });
        }
    }, 1200), 
    fileInput: function(ev){
        var that = this, reader = new FileReader();
        this.$playlist.html(_.template($('#loading-view').text(), {}));
        reader.onload = function(e){
            $.post('/rdio-playlist-by-xml/', {data: e.target.result}, function(data){
                that.renderPlaylist(data.tracks, data.name); 
            });
        };
        reader.readAsText(ev.target.files[0]);
    }
});

var GenreListView = Backbone.View.extend({    
    el: $('#base-right'),
    events: {
        'click button.genre-make-seed:not(.selected)': 'makeSeed',
        'click button.genre-make-seed.selected': 'removeSeed'
    },
    makeSeed: function(ev){
        console.log('call makeSeed');
        var $btn = $(ev.currentTarget);
        var name = $btn.parents('.genre-row').data('genre');
        Backbone.pubSub.trigger('updateGenreSeeds', name);
        Backbone.pubSub.trigger('seedsChanged');
        $btn.addClass("selected");
    },
    removeSeed: function(ev){
        var $btn = $(ev.currentTarget);
        var name = $btn.parents('.genre-row').data('genre');
        var seeds = _.filter(this.model.get('genreSeeds'), function(it){
            return it !== name.toLowerCase();
        });
        this.model.set({genreSeeds: seeds});
        Backbone.pubSub.trigger('updateGenreSeeds');
        Backbone.pubSub.trigger('seedsChanged');
        $btn.removeClass("selected");
    },
    render: function(genreList){
        this.$el.html(_.template($('#playlist-view-genres').text(), {genres: genreList, model:this.model.toJSON()}));
    }
});

var GenreSeedInputView = SeedInputView.extend({
    events: {
        'click div.unseed-genre': 'unseedGenre',
        'click div.genre-ctl': 'toggleTypeahead',
        'change #seed-genre': 'changeGenre',
        'mouseenter div.popular-genre': 'hoverPopular',
        'mouseleave div.popular-genre': 'requestArtists',
        'mouseenter div.genre-ctl-seed': 'hoverSeed',
        'mouseleave div.genre-ctl-seed': 'closeHoverSeed'
    },
    typeahead: new GenreTypeaheadView(),
    pop_genres: null,
    selectedPopular: null,

    hoverPopular: function(ev){
        var genre = $(ev.currentTarget).data('genre'), that = this;
        $(ev.currentTarget).animate(
            {'color':'#fff', 
             'background-color':'rgb(0,172,235)'
            }, 
            350, 
            function(){
                that.expandGenre(genre);
                //that.selectedPopular = genre;
                $('.popular-genre').removeClass('selected');
                $(ev.currentTarget).addClass('selected');
                $('.popular-genre:not(.selected)').css('background-color', 'rgb(250,250,250)');
                $('.popular-genre:not(.selected)').css('color', 'rgb(20,20,20)');
            }
        );
    },
    closeHoverSeed: function(ev){
        clearTimeout(this._timeout);
    },

    hoverSeed: function(ev){
        var genre = $(ev.currentTarget).data('genre'), that = this;
        console.log('hoverSeed '+genre);
        this._timeout = setTimeout(function(){
            that.expandGenre(genre);
            $('.popular-genre').removeClass('selected');
        }, 350);        
    },

    expandGenre: function(genre){
        console.log('expand genre')
        var that = this;
        $.get('/similar-genres/'+genre, function(data){
            that.genre_sims.render(data.results);
            $('.billboard').addClass('hidden');
            $('.billboard').css('display', 'none');
            $('.playlist').fadeIn(500, function(){
                $('.playlist').removeClass('hidden');
            });
            //that.similarGenreArtists(data.results);
        });
    },

    requestArtists: function(ev){
        $(ev.currentTarget).stop();
        if(!$(ev.currentTarget).hasClass('selected')){
            $(ev.currentTarget).css('background-color', 'rgb(250,250,250)').css('color', 'rgb(20,20,20)');
        }
    },

    initialize: function(){
        this.genre_sims = new GenreListView({model: this.model});
        var that = this;
        Backbone.pubSub.on('expandGenre', function(genre){
            that.expandGenre(genre);
        });
        Backbone.pubSub.on('requestArtists', function(){
            that.requestArtists();
        });
        this.render();
    },

    render: function(){
        var that = this;
        this.$el.html(_.template($('#seeds-view-genre').text(), {model:this.model.toJSON()}));
        if(this.pop_genres !== null){
            $('#popular-genres').html(_.template($('#popular-genres-view').text(), {genres: this.pop_genres}));
        }else{
            $.get(_baseURL + 'artist/top_terms?api_key=BNXHLOQDXVWCWUU3K&format=json&results=50', function(data){
                var unfiltered = _.pluck(data.response.terms, 'name');
                $.post('/filter-genres/', {genres: unfiltered.join()}, function(data){
                    this.pop_genres = data.results;
                    $('#popular-genres').html(_.template($('#popular-genres-view').text(), {genres: this.pop_genres}));
                });
            });
        }
    },

    renderSeeds: function(){
        this.$el.find('.genre-seeds').html(_.template($('#seeds-view-genre-seeds').text(), {model:this.model.toJSON()}));
    },

    toggleTypeahead: function(ev){
        $('#seeds-board').addClass('hidden');
        $('#seeds-board').css('display', 'none');
        $('#seeds-typeahead-board').removeClass('hidden');
        $('#seeds-typeahead-board').css('display', 'block');
        //that.typeahead.setIndex(that.activeIndex); TODO BRING BACK
        this.typeahead.render();
        $('.genre-input').focus();
    },

    changeGenre: function(ev){
        Backbone.pubSub.trigger('seedsChanged');
    },

    clickPopular: function(ev){
        if($(ev.currentTarget).hasClass('selected')){
            $(ev.currentTarget).removeClass('selected');
            this.selectedPopular = null;
            return;
        }
        $('.popular-genre').removeClass('selected');
        $(ev.currentTarget).addClass('selected');
        var genre = $(ev.currentTarget).data('genre');
        this.selectedPopular = genre;
        this.expandGenre(genre);
    },
    unseedGenre: function(ev){
        var gen = $(ev.currentTarget).parent('.genre-ctl-seed').data('genre');
        var curr = this.model.get('genreSeeds');
        curr = _.filter(curr, function(item){return item !== gen});
        this.model.set('genreSeeds', curr);
        Backbone.pubSub.trigger('updateGenreSeeds');
        if(curr.length > 0){
            Backbone.pubSub.trigger('seedsChanged');
        }else{
            this.model.set({currentArtistList: null});
            Backbone.pubSub.trigger('resetSeedsBoard');
            Backbone.pubSub.trigger('resetSideNav');
            Backbone.pubSub.trigger('displayArtists');
        }
        ev.stopPropagation();
    }
});

var FilterView = CommonView.extend({
    el: $('#filter-board'),
    filterDisplays: {},
    events: {
        'change input.filter-reg[type="range"]': 'changeFilter',
        'click button.filter-reg-toggle': 'toggleFilter',
        'change input.filter-adv[type="range"]': 'changeAdvancedFilter',
        'click .drop-div': 'toggleDropDiv',
        'click .drop-div-long': 'toggleDropDivLong',
        'click input[type="radio"]': 'clickRadioButton',
        'click button.filter-adv-toggle': 'toggleFilter',
        'click a.open-advanced': 'openAdvanced',
        'click a.close-advanced': 'closeAdvanced'
    },
    initialize: function(){
        this.render();
    },
    render: function(){
        var curr = this.model.get('currentFilters');
        var allFilts = {};
        _.each(curr, function(item, key, list){ 
            allFilts[item.el] = item.value;
        });
        this.$el.html(_.template($('#adjust-filters-view').text(), 
                        {filters: allFilts, slider_texts: SLIDER_TEXTS}));
    },
    changeFilter: function(ev){
        Backbone.pubSub.trigger('changeFilter', {el: $(ev.target).attr('id'), value: $(ev.target).val()}, $(ev.target));
    },
    changeAdvancedFilter: function(ev){
        return this.changeFilter(ev);
    },
    toggleFilter: function(ev){
        var $btn = $(ev.currentTarget);
        if($btn.hasClass('active')){
            $btn.parents('.filter').children('input').attr("disabled", true);
        }else{
            $btn.parents('.filter').children('input').removeAttr("disabled");
        }
        Backbone.pubSub.trigger('toggleFilter', {el: $(ev.currentTarget).attr('id'), enabled: !$btn.hasClass('active')});
    },
    toggleDropDiv: function(ev){
        if($('.popover').length){
            $('.drop-div, .drop-div-long').popover('hide'); return;
        }
        var that = this, $tgt = $(ev.currentTarget);
        var type = $tgt.data('type'), top = $tgt.offset().top, left = $tgt.offset().left;
        $(ev.currentTarget).popover('toggle');
        $('.popover-content').html(_.template($('#drop-div-'+type).text(), {}));
        $('.popover').css('top', top+51);
        $('.popover').css('left', left+39);
        $('.popover .arrow').css('left', 167);
        $('.drop-div-item').click(function(){
            var newVal = $(this).children('.val').text();
            var index = $(this).data('value');
            that.filterDisplays[type] = newVal;
            $(ev.currentTarget).children('.pl-'+type).text(newVal);
            $tgt.data('value', index);
            $('.drop-div').popover('hide'); 
            Backbone.pubSub.trigger('changeFilter', {el:type, value:index}, $tgt);
        });
    },
    toggleDropDivLong: function(ev){
        if($('.popover').length){
            $('.drop-div, .drop-div-long').popover('hide'); 
            return;
        }
        var that = this;
        var $tgt = $(ev.currentTarget);
        var type = $tgt.data('type'), top = $tgt.offset().top, left = $tgt.offset().left;
        $tgt.popover('toggle');
        $('.popover-content').html(_.template($('#drop-div-'+type).text(), {}));
        $('.popover').css('top', top + 51);
        $('.popover').css('left', left + 272);
        $('.popover .arrow').css('left', 167);
        $('.drop-div-item').click(function(){
            var index = $(this).data('value'), newVal = $(this).children('.val').text();
            that.filterDisplays[type] = newVal;
            $(ev.currentTarget).children('.pl-'+type).text(newVal);
            $tgt.find('em').text('s');
            $tgt.data('value', newVal);
            $('.drop-div-long').popover('hide'); 
            Backbone.pubSub.trigger('changeFilter', {el: type, value: index}, $tgt);
        });
    },
    clickRadioButton: function(ev){
        var newVal = $(ev.currentTarget).val();
        var name = $(ev.currentTarget).attr('name');
        Backbone.pubSub.trigger('changeFilter', {el: name, value: newVal}, $(ev.currentTarget));
    },
    openAdvanced: function(ev){
        var curr = this.model.get('currentFilters');
        var allFilts = {};
        _.each(curr, function(item, key, list){ 
            allFilts[item.el] = item.value;
        });
        this.$el.html(_.template($('#advanced-filters-view').text(), 
                                    {filters:        allFilts, 
                                     slider_texts:   SLIDER_TEXTS, 
                                     filterDisplays: this.filterDisplays}));
        $('.drop-div, .drop-div-long').popover({
            container: 'body', 
            placement: 'bottom', 
            trigger:'manual', 
            delay: { show: 500, hide: 100 }
        }); 
    },
    closeAdvanced: function(ev){
        $('.drop-div, .drop-div-long').popover('hide'); 
        this.render();
    }
});

var DetailView = Backbone.View.extend({
    el: $('#playlist-detail'),
    genres: [],
    controls: {
        boosts:   [],
        excludes: []
    },
    clear: function(){
        this.genres = []; 
        this.controls = {boosts:   [],
                         excludes: []};
    },
    events: {
        'click button.radio-check.active': 'radioCheck',
        'click button.genre-boost:not(".active")': 'genreBoost',
        'click button.genre-exclude:not(".active")': 'genreExclude',
        'click button.unban': 'artistUnban'
    },
    radioCheck: function(ev){
        var $btn = $(ev.currentTarget);
        var genre = $btn.parents('.genre-view').data('genre');
        $btn.removeClass('active');
        if($btn.hasClass('genre-boost')){
            this.controls.boosts = _.without(this.controls.boosts, genre);
        }else if($btn.hasClass('genre-exclude')){
            this.controls.excludes = _.without(this.controls.excludes, genre);
        }
        this.model.set({boosts: this.controls.boosts, excludes: this.controls.excludes})
        Backbone.pubSub.trigger('changeBoosts');
        ev.stopPropagation();
    },
    genreBoost: function(ev){
        var $btn = $(ev.currentTarget);
        if($btn.hasClass('active')) return;
        var genre = $btn.parents('.genre-view').data('genre');
        this.controls.excludes = _.without(this.controls.excludes, genre);
        this.controls.boosts.push(genre);
        this.model.set({boosts: this.controls.boosts, excludes: this.controls.excludes});
        Backbone.pubSub.trigger('changeBoosts');
    },
    genreExclude: function(ev){
        var $btn = $(ev.currentTarget);
        if($btn.hasClass('active')) return;
        var genre = $btn.parents('.genre-view').data('genre');
        this.controls.boosts = _.without(this.controls.boosts, genre);
        this.controls.excludes.push(genre);
        this.model.set({boosts: this.controls.boosts, excludes: this.controls.excludes});
        Backbone.pubSub.trigger('changeBoosts');
    },
    reset: function(genres, scores){
        if(genres) this.genres = genres;
        if(scores) this.scores = scores;
        if(this.model.get('artistBans').length === 0){
            this.render();
        }else{
            this.renderGenres();
        }
    },
    render: function(){
        var mod = this.model.toJSON();
        console.log('about to render');
        console.log(this.scores);
        var detail_html = _.template($('#detail-view').text(), 
                                {genres:this.genres, 
                                 scores:this.scores,
                                 controls:this.controls, 
                                 model:mod});
        $('#playlist-detail').html(detail_html);
        _.each($('img.unset'), function(item, key, list){
            var name = $(item).parents('.ban-view').data('name');
            $.get('/artist-img/?name='+name, function(data){
                item.src = data.url;
            });
        });
    },
    renderGenres: function(){
        var mod = this.model.toJSON();
        console.log('about to renderGenres');
        console.log(this.scores);
        var gens_html = _.template($('#gens-view').text(),
                            {genres:this.genres, 
                             scores:this.scores,
                             controls:this.controls,
                             model:mod});
        $('#genres-view').html(gens_html);
    },
    artistUnban: function(ev){
        var $ban = $(ev.currentTarget).parents('.ban-view'), that=this;
        var name = $ban.data('name'), bans = this.model.get('artistBans');
        this.model.set('artistBans', _.filter(bans, function(it){return it !== name;}));
        $ban.addClass('animated fadeOutUp');
        Backbone.pubSub.trigger('seedsChanged');
        setTimeout(function(){
            $ban.remove();
            that.reset();
        }, 500);
    }
});

var PlaylistView = CommonView.extend({    
    el: $('#base-right'),
    _xhf: null,
    detail: null,
    base_url: _baseURL,
    api_key: 'BNXHLOQDXVWCWUU3K',
    options: {},
    targets: {
        // Upbeat filter (5)
        'upbeat': [{'target_energy': 0.0,
                    'target_danceability': 0.0,
                    'target_valence': 0.1,
                    'target_tempo': 60},
                   {'target_energy': 0.4,
                    'target_danceability': 0.4,
                    'target_valence': 0.3,
                    'target_tempo': 80},
                   {'target_energy': 0.5,
                    'target_danceability': 0.5,
                    'target_valence': 0.5,
                    'target_tempo': 100},
                   {'target_energy': 0.6,
                    'target_danceability': 0.7,
                    'target_valence': 0.7,
                    'target_tempo': 120},
                   {'target_energy': 0.7,
                    'target_danceability': 0.9,
                    'target_valence': 0.9,
                    'target_tempo': 140}],
        // Familiar filter (5)
        'familiar': [{'target_artist_familiarity': 0.3,
                      'target_song_hotttnesss': 0.4},
                     {'target_artist_familiarity': 0.45,
                      'target_song_hotttnesss': 0.5},
                     {'target_artist_familiarity': 0.6,
                      'target_song_hotttnesss': 0.6},
                     {'target_artist_familiarity': 0.7,
                      'target_song_hotttnesss': 0.7},
                     {'target_artist_familiarity': 0.8,
                      'target_song_hotttnesss': 0.8}],
        // Buzz filter (5)
        'buzz': [{'target_song_hotttnesss':0.8},
                 {'target_song_hotttnesss':0.8},
                 {'target_song_hotttnesss':0.5},
                 {'target_song_discovery':0.6},
                 {'target_song_discovery':0.8}],
        // Electric/Acoustic filter (5)
        'electric': [{'target_acousticness': 0.1 },
                     {'target_acousticness': 0.3 },
                     {'target_acousticness': 0.5 },
                     {'target_acousticness': 0.7 },
                     {'target_acousticness': 0.9 }],
        'artist-hot': [{'target_artist_hotttnesss': 0.1},
                       {'target_artist_hotttnesss': 0.3},
                       {'target_artist_hotttnesss': 0.5},
                       {'target_artist_hotttnesss': 0.7},
                       {'target_artist_hotttnesss': 0.9}],
        'song-hot': [{'target_song_hotttnesss': 0.1},
                     {'target_song_hotttnesss': 0.3},
                     {'target_song_hotttnesss': 0.5},
                     {'target_song_hotttnesss': 0.7},
                     {'target_song_hotttnesss': 0.9}]
    },
    target_opts: {
        'upbeat': [{'max_energy': 0.45,
                     'max_danceability': 0.5,
                     'max_tempo': 140,},
                    {'max_energy': 0.55,
                     'max_danceability': 0.6,
                     'max_tempo': 160,},
                    null,
                    {'min_energy': 0.25,
                     'min_danceability': 0.1,
                     'min_tempo': 40,},
                    {'min_energy': 0.35,
                     'min_danceability': 0.2,
                     'min_tempo': 60,}],
        'adventurous': [{'variety': 1.0},
                        {'variety': 1.0},
                        {'variety': 0.7},
                        {'variety': 0.4},
                        {'variety': 0.1}],
        'electric': [{'max_acousticness': 0.5 },
                     {'max_acousticness': 0.5 },
                     null,
                     {'min_acousticness': 0.5 },
                     {'min_acousticness': 0.5 }],
        'familiar': [{'artist_max_familiarity': 0.4,
                      'song_max_hotttnesss': 0.6},
                     {'artist_max_familiarity': 0.5,
                      'song_max_hotttnesss': 0.6},
                     {'artist_max_familiarity': 0.6,
                      'song_max_hotttnesss': 0.7},
                     {'artist_max_familiarity': 0.7,
                      'song_max_hotttnesss': 0.7},
                     {'artist_max_familiarity': 0.9,
                      'song_max_hotttnesss': 0.9}],
        'buzz': [{'artist_pick':'song_hotttnesss-desc'},
                 {'artist_pick':'song_hotttnesss-desc'},
                 {'artist_pick':'song_hotttnesss-desc'},
                 {'artist_pick':'song_discovery-desc'},
                 {'artist_pick':'song_discovery-desc'}],
        'decade': [{'artist_start_year_before':'1975',
                    'artist_end_year_after':'1975'},
                   {'artist_start_year_before':'1985',
                    'artist_end_year_after':'1985'},
                   {'artist_start_year_before':'1995',
                    'artist_end_year_after':'1995'},
                   {'artist_start_year_before':'2005',
                    'artist_end_year_after':'2005'},
                   {'artist_start_year_before':'2013',
                    'artist_end_year_after':'2013'}],
        'artist-hot': [null,
                       null,
                       null,
                       {'artist_min_hotttnesss': 0.5},
                       {'artist_min_hotttnesss': 0.5}],
        'song-hot': [{'song_min_hotttnesss': 0.1},
                     {'song_min_hotttnesss': 0.1},
                     {'song_min_hotttnesss': 0.1},
                     {'song_min_hotttnesss': 0.2},
                     {'song_min_hotttnesss': 0.3}],
        'holiday': [null,
                    {'song_type': 'christmas:false'},
                    {'song_type': 'christmas:true'}],
        'live': [null,
                {'song_type': 'live:false'},
                {'song_type': ['live:true', 'studio:false']}],
        'length-min': [{'min_duration': '0'},
                       {'min_duration': '60'},
                       {'min_duration': '120'},
                       {'min_duration': '180'},
                       {'min_duration': '240'},
                       {'min_duration': '300'}],
        'length-max': [{'max_duration': '240'},
                       {'max_duration': '300'},
                       {'max_duration': '360'},
                       {'max_duration': '420'},
                       {'max_duration': '480'},
                       {'max_duration': '540'},
                       {'max_duration': '600'}]
    },
    steers: {},
    steer_opts: {},
    session_id: null,
    reset: function(){
        this.steers={},this.options={},this.steer_opts={},this.session_id=null;
    },
    events: {
        'click .playlist-row':              'playSong',
        'click .artist-add:not(".active")': 'artistAdd',
        'click .artist-ban:not(".active")': 'artistBan',
        'click .artist-add.active':         'artistUnseed',
        'click .artist-ban.active':         'artistUnban',
        'click .close-alert':               'closeAlert'
    },

    initialize: function(){
        var that = this;
        Backbone.pubSub.on('changeFilter', function(filter, tgt){
            Backbone.pubSub.trigger('loading', false);
            var pref = tgt.parents('.filter').find('.filter-pref');
            if(pref) pref.text(SLIDER_TEXTS[filter.el][filter.value]);
            that.throttleFilterChange(filter);
        });
        Backbone.pubSub.on('toggleFilter', function(filter){
            if(!filter.enabled){
                var curr = that.model.get('currentFilters');
                curr =_.filter(curr, function(f){ f.el !== filter.el; }); 
                var curr = that.model.set('currentFilters', curr);
            }
            // update local attrs from model
            that.resetFilters();
            that.steer_fetch(that.steers, true);
        });
        Backbone.pubSub.on('displayPlaylist', this.displayPlaylist, this);
        Backbone.pubSub.on('displayArtists', this.displayArtists, this);
        Backbone.pubSub.on('seedsChanged', function(){that.seedsChanged();});
        Backbone.pubSub.on('changeBoosts', function(){that.boostsChanged();});
    },

    displayPlaylist: function(fade){
        var doFade = true;
        if(fade !== undefined){
            doFade = fade;
        }
        var snglist = this.model.get('currentSongList');
        if(snglist && !(this.model.get('recalc'))){
            if(doFade) this.$el.css('display', 'none');
            this.$el.html(_.template($('#playlist-view').text(), {model: this.model.toJSON()}));
            if(doFade) this.$el.fadeIn(500);
        }else{
            this.model.set({recalc: false});
            this.steer_fetch(this.steers, true);
        }
    },

    displayArtists: function(fade){
        var doFade = true;
        if(fade !== undefined){
            doFade = fade;
        }
        var artlist = this.model.get('currentArtistList');
        if(artlist && artlist !== null){
            if(doFade) this.$el.css('display', 'none');
            this.$el.html(_.template($('#playlist-view-artists').text(), {model:this.model.toJSON()}));
            if(doFade) this.$el.fadeIn(500);
        }else{
            var newhtml = _.template($('#playlist-view-artists-empty').text(), {});
            this.$el.html(newhtml);
        }
    },

    throttleFilterChange: _.debounce(function(filter){
        if(filter.el in this.targets){
            this.steers = _.extend(this.steers, this.targets[filter.el][filter.value]);
        }
        for(tgt in this.steers){
            if(this.steers[tgt] === null) delete this.steers[tgt];
        }
        if(filter.el in this.target_opts){
            this.steer_opts = _.extend(this.steer_opts, this.target_opts[filter.el][filter.value]);
            this.setOptions();
        }
        for(tgt in this.steer_opts){
            if(this.steer_opts[tgt] === null) delete this.steer_opts[tgt];
        }
        var curr = _.filter(this.model.get('currentFilters'), function(filt){
            return filt.el !== filter.el && SLIDER_TEXTS[filt.el][filt.value] !== 'No Preference';
        });
        if(SLIDER_TEXTS[filter.el][filter.value] !== 'No Preference'){
            curr.push(filter);
        }
        this.model.set({currentFilters: curr});
        $('#loading-bar').stop();
        $('#loading-bar').animate({'width':'40px'}, 600);
        this.resetFilters();
        this.steer_fetch(this.steers, true);
    }, 1000),

    throttleFilterAlt: _debounce(function(filter){
        if(filter.el in this.targets){
            this.steers = _.extend(this.steers, this.targets[filter.el][filter.value]);
        }
        for(tgt in this.steers){
            if(this.steers[tgt] === null) delete this.steers[tgt];
        }
        if(filter.el in this.target_opts){
            this.steer_opts = _.extend(this.steer_opts, this.target_opts[filter.el][filter.value]);
            this.setOptions();
        }
        for(tgt in this.steer_opts){
            if(this.steer_opts[tgt] === null) delete this.steer_opts[tgt];
        }
        var curr = this.model.get('currentFilters');
        curr = _.filter(curr, function(filt){return filt.el !== filter.el});
        if(curr){
            curr.push(filter);
            this.model.set({currentFilters: curr});
        }else{
            this.model.set({currentFilters: [filter]});
        }
        $('#loading-bar').stop();
        $('#loading-bar').animate({'width':'40px'}, 600);
        this.resetFilters();
        this.steer_fetch(this.steers, true);
    }, 1200, false),

    resetFilters: function(){
        this.steers = {};
        this.steer_opts = {};
        var current = this.model.get('currentFilters');
        var that = this, doSetOpts = false;
        _.each(current, function(filter, key, list){
            if(filter.el in that.targets){
                that.steers = _.extend(that.steers, that.targets[filter.el][filter.value]);
            }
            if(filter.el in that.target_opts){
                that.steer_opts = _.extend(that.steer_opts, that.target_opts[filter.el][filter.value]);
                doSetOpts = true;
            }
        });
        for(tgt in that.steers){
            if(that.steers[tgt] === null) delete that.steers[tgt];
        }
        for(tgt in that.steer_opts){
            if(that.steer_opts[tgt] === null) delete that.steer_opts[tgt];
        }
        if(doSetOpts) this.setOptions();
    },

    setOptions: function(){
        var type = this.model.get('currentType'),descs=[],boosts=this.model.get('boosts'),excludes=this.model.get('excludes');
        this.options = {'min_duration':'120', 'max_duration':'480'}; /* default options */
        if(type === 'artist'){
            this.options['type'] = 'artist-radio';
            var artists = _.filter(this.model.get('artistSeeds'), function(item){ return item !== null });
            this.options['artist'] = artists;
        }else if(type === 'track'){
            this.options['type'] = 'song-radio';
            var trax = _.pluck(_.filter(this.model.get('trackSeeds'), function(item){ return item !== null }),'id');
            this.options['song_id'] = trax;
        }else if(type === 'genre'){
            this.options['type'] = 'genre-radio';
            this.options['genre'] = this.model.get('genreSeeds');
        }else if(type === 'playlist'){
            var pl = this.model.get('playlistSeed'), trax, arts;
            this.options['type'] = 'playlist-mirror';
            trax = _.pluck(_.filter(pl.tracks, function(item){ return item !== null }),'id');
            arts = _.pluck(_.filter(pl.tracks, function(item){ return item !== null }),'artist_id');
            this.options['playlist'] = trax;
            this.options['artist_id'] = arts;
        }
        this.options = _.extend(this.options, this.steer_opts);
    },

    seedsChanged: function(){
        this.model.set({recalc: true});
        this.setOptions();
        var curr = this.getCurrentSeed();
        console.log(curr);
        console.log(this.model);
        if(curr && (curr.length > 0 || (curr.tracks && curr.tracks.length > 0))) {
            this.fetch_artists(this.options);
            if(!$('.billboard').hasClass('hidden')) {
                $('.billboard').addClass('hidden');
                $('.billboard').css('display', 'none');
                $('.playlist').removeClass('hidden');
                $('.playlist').css('display', 'block');
            }
        } else {
            console.log('no current seed, no artist list!!');
        }
        Backbone.pubSub.trigger('resetSideNav');
    },

    boostsChanged: function(){
        console.log('changed boosts');
        this.model.set({recalc: true});
        this.setOptions();
        this.fetch_artists(this.options);
    },

    render: function(scrollTop){
        var _scrollTop = scrollTop || 0;
        if(this.model.get('currentSongList')){
            this.$el.html(_.template($('#playlist-view').text(), {model: this.model.toJSON()}));
        }else{
            this.$el.html(templates['playlist-view']);
        }
        $('.playlist-box').scrollTop(_scrollTop);
    },

    playSong: function(ev){
        var rdio = $(ev.currentTarget).data('rdio');
        var index = $(ev.currentTarget).data('index');
        var time = $(ev.currentTarget).data('time');
        var dur = $(ev.currentTarget).data('duration');
        if(this.model.get('rdioReady')){
            rdio_play(rdio);
        }else{
            R.player.play({source:rdio});
        }
        $('#time').text(time);
        $('#player').data('duration', dur);
        $('.index-cell').css('display', 'block');
        $('.playing-cell').css('display', 'none');
        $(ev.currentTarget).children('.index-cell').css('display', 'none');
        $(ev.currentTarget).children('.playing-cell').css('display', 'block');
        this.model.set({currentRdio: rdio});
        this.model.set({playingTrackLength: time});
        this.model.set({playingTrackDuration: dur});
        this.model.set({playingIndex: index});
    },

    artistAdd: function(ev){
        var $btn = $(ev.currentTarget);
        var name = $btn.parents('.artist-row').data('name');
        var currentSeeds = this.model.get('artistSeeds');
        var index = _.indexOf(currentSeeds, null);
        // TODO is this working?
        if(typeof index != 'undefined'){
              Backbone.pubSub.trigger('updateArtistSeeds', index, name);
              Backbone.pubSub.trigger('seedsChanged');
        }else{
              alert('You already have 5 artists'); 
        }
    },

    artistBan: function(ev){
        var $btn = $(ev.currentTarget);
        var name = $btn.parents('.artist-row').data('name');
        // add name to model:artistBans
        var bans = this.model.get('artistBans');
        if(bans.length > 0){
            bans.push(name);
            this.model.set({artistBans: bans});
        }else{
            $('#bans-view p.light-text').removeClass('light-text');
            this.model.set({artistBans: [name]});
        }
        $('#bans-view').append(_.template($('#single-ban').text(), {name: name}));
        this.updateUnsetImages();   
        Backbone.pubSub.trigger('updateDetail');
        Backbone.pubSub.trigger('seedsChanged');
    },

    artistUnseed: function(ev){
        this.undoAction(ev);
        var $btn = $(ev.currentTarget);
        var name = $btn.parents('.artist-row').data('name');
        var currentSeeds = this.model.get('artistSeeds');
        var index = _.indexOf(currentSeeds, name);
        currentSeeds[index] = null;
        this.model.set('artistSeeds', currentSeeds);
        Backbone.pubSub.trigger('updateArtistSeeds', index);
        Backbone.pubSub.trigger('seedsChanged');
    },

    artistUnban: function(ev){
        this.undoAction(ev);
        var $btn = $(ev.currentTarget);
        var name = $btn.parents('.artist-row').data('name');
        var bans = this.model.get('artistBans');
        bans.splice(_.indexOf(bans, name), 1);
        this.model.set('artistBans', bans);
        $('.ban-view[data-name="'+name+'"]').remove();
        Backbone.pubSub.trigger('updateDetail');
        Backbone.pubSub.trigger('seedsChanged');
    },

    undoAction: function(ev){
        var $btn = $(ev.currentTarget);
        $btn.removeClass('active');
        ev.stopPropagation();
    },

    updateUnsetImages: function(){
        var that = this;
        var library = this.model.get('artistImgs');
        _.each($('img.unset'), function(item, key, list){
            var name = $(item).parents('.ban-view').data('name');
            if(name in library){
                item.src = library[name];
            }else{
                $.get('/artist-img/?name='+name, function(data){
                    item.src = data.url;
                    library[name] = data.url;
                    that.model.set('artistImgs', library);
                });
            }
        });
    },

    fetch_artists: function(options){
        var that = this;
        this.clearXHF();
        $('#rep-artist-header').html('Loading artists...');
        this._xhf = $.post('/artist-list/', _.extend({}, options), function(data){
            $('#rep-artist-header').html('Representative Artists');
            that.model.set({currentArtistList: data.artists});
            that.$el.html(_.template($('#playlist-view-artists').text(), {model:that.model.toJSON()}));
            if(data.top_genres.length >= 2){
                that.model.set({currentGenre: data.top_genres[0]+' / '+data.top_genres[1]});
            }
            Backbone.pubSub.trigger('updateDetail', data.top_genres, data.scores);
        });
    },

    clearXHF: function(){
        if(this._xhf && this._xhf.readyState < 4){
            this._xhf.abort();
        }
    },

    new_session: function(options, callback){
        var bans = this.model.get('artistBans'), that = this;
        this.dyn_url = this.base_url + 'playlist/dynamic/create';
        this.dyn_url += '?api_key='+this.api_key+'&dmca=false';
        this.dyn_url += '&bucket=audio_summary&bucket=id:rdio-US&bucket=tracks&limit=true';
        if(options){
            this.dyn_url += '&'+serialize(options);
        }
        if(this.boosts && this.boosts.length > 0){
            var clean_boosts = {description: _.map(this.boosts, function(el){return el+'^2';})};
            this.dyn_url += '&'+ serialize(clean_boosts);
        }
        if(this.excludes && this.excludes.length > 0){
            var clean_exes = {description: _.map(this.excludes, function(el){return '-'+el;})};
            this.dyn_url += '&'+ serialize(clean_exes);
        }
        Backbone.pubSub.trigger('loading', true);
        this.clearXHF();
        this._xhf = $.get(this.dyn_url, function(resp){
            that.session_id = resp.response.session_id;
            if (_DEBUG) that.debugMsg();
            if (bans){
                var fb_url = that.base_url + 'playlist/dynamic/feedback'
                fb_url += '?api_key='+that.api_key+'&session_id='+that.session_id;
                bans.forEach(function(b){
                    fb_url += '&ban_artist='+b;
                });
                $.get(fb_url, function(data){
                    if (callback) callback.apply(that);
                });
            }else{
                if (callback) callback.apply(that);
            }
        });
    },

    debugMsg: function(){
        $('#debug-panel').html('<p><a href="' + _baseURL + 'playlist/dynamic/info?api_key='+this.api_key+'&session_id='+this.session_id+'" target=_blank>'+this.session_id+' Debug Me!</p>');    
    },

    _parseTime: function(){
        var hrs = parseInt($('.drop-div .pl-hour').text());
        var mins = parseInt($('.drop-div .pl-minute').text());
        var minutes = mins + 60*hrs;
        return [parseInt(minutes/4).toString(), minutes.toString()];
    },

    fetch_dynamic: function(options, recreate){
        var lenOpts = this._parseTime();
        if(this.session_id && !recreate){
            this.gather_songs(this.session_id, lenOpts[0], lenOpts[1]);
        }else{
            this.new_session(options, function(){
                this.gather_songs(this.session_id, lenOpts[0], lenOpts[1]);
            });
        }
    },

    get_steer_callback: function(steers){
        var lenOpts = this._parseTime();
        if(_.size(steers) > 0) return function(){
            var url = this.base_url + 'playlist/dynamic/steer';
            url += '?'+serialize(steers);
            url += '&api_key='+this.api_key;
            url += '&session_id='+this.session_id;
            var that = this;
            $.get(url, function(resp){
                that.gather_songs(that.session_id, lenOpts[0], lenOpts[1]);
            }); 
        };
        return function(){
            this.gather_songs(this.session_id, lenOpts[0], lenOpts[1]);
        };
    },

    steer_fetch: function(steers, recreate){

        // either call new_session, gather_songs,
        // or do a dynamic-restart and then call the steer_callback
        // which conditionally does a dynamic steer and then calls gather

        var that = this, url;
        if(this.options.type === 'playlist-mirror'){
            var lenOpts = this._parseTime();
            this.mirror_songs(lenOpts[0], lenOpts[1]);
            return;
        }
        if(recreate || this.session_id === null){
            this.new_session(this.options, this.get_steer_callback(steers));
        }else{
            url = this.base_url + 'playlist/dynamic/restart';
            url += '?api_key='+this.api_key+'&session_id='+this.session_id;
            url += '&bucket=tracks&bucket=audio_summary&limit=true&bucket=id:rdio-US';
            if(this.options) url += '&'+serialize(this.options);
            this.clearXHF();
            this._xhf = $.get(url, function(){
                that.get_steer_callback(steers).apply(that);
            });
        }
    },

    gather_songs: function(session_id, length, minutes, extend){
        var that = this, ext = extend || false;
        var url = '/gather-songs?sess_id='+session_id+'&results='+length+'&minutes='+minutes;
        this.clearXHF();
        if(ext) url += '&extend';
        if('song_id' in this.options){
            url += '&tracks='+this.options['song_id'].join();
        }
        this._xhf = $.get(url, function(resp){
            Backbone.pubSub.trigger('doneLoading', function(){
                if(!ext){
                    that.model.set('currentSongList', resp.songs);
                    that.model.set('currentDuration', resp.duration);
                    var arts = _.uniq(_.pluck(resp.songs, 'artist_id')).length;
                    that.model.set('currentTotalArtists', arts);
                }else{
                    var curr = that.model.get('currentSongList'), currDur = that.model.get('currentDuration');
                    var newSongList = curr.concat(resp.songs);
                    that.model.set('currentSongList', newSongList);
                    that.model.set('currentDuration', currDur + resp.duration);
                    that.model.set('currentTotalArtists', _.uniq(_.pluck(newSongList, 'artist_id')).length);
                }
                var rdioIds = _.map(resp.songs, function(it){ 
                    if(it.tracks) return it.tracks[0]['foreign_id'].split(':')[2];
                });
                that.render();
                that.updateDetail();
                Backbone.pubSub.trigger('renderRefinePlaylist');
            });
        });
    },
    mirror_songs: function(length, minutes){
        var that = this;
        this.clearXHF();
        Backbone.pubSub.trigger('loading', true);
        this._xhf = $.post('/mirror-songs/?results='+length+'&minutes='+minutes, 
                            this.options, function(resp){
            Backbone.pubSub.trigger('doneLoading', function(){
                that.model.set('currentSongList', resp.songs);
                var arts = _.uniq(_.pluck(resp.songs, 'artist_id')).length;
                that.model.set('currentTotalArtists', arts);
                that.model.set('currentDuration', resp.duration);
                that.$el.html(_.template($('#playlist-view').text(), {model: that.model.toJSON()}));
                Backbone.pubSub.trigger('renderRefinePlaylist');
                that.updateDetail();
            });
        });
    },
    updateDetail: function(){
        var that = this;
        var enids = _.map($('.playlist-row'), function(el){
            return $(el).data('en');
        });
        this.clearXHF();
        this._xhf = $.post('/playlist-detail/', {'enids': enids}, function(data){
            Backbone.pubSub.trigger('updateDetail', data.top_genres, data.scores)
        });
    },
    closeAlert: function(ev){
        $('.alert-row').remove();
        $('.playlist-box').css('height', '490px');
    },
});

var PlayerView = Backbone.View.extend({
    el: 'body',
    events: {
        'click button#play':     'sendPlay',
        'click button#pause':    'sendPause',
        'click button#next':     'sendNext',
        'click button#previous': 'sendPrevious'
    },
    render: function(){
        var that = this;
        $('#player').html(_.template($('#player-view').text(), {model: this.model.toJSON()}));

        Backbone.pubSub.on('playStateChanged', function(state){
            if (state === 2){
                $('#pause').addClass('hidden');
                $('#play').removeClass('hidden');
            }else if(state === 0 || state === 4){
                $('#pause').addClass('hidden');
                $('#play').removeClass('hidden');
            }else if (state == 1){
                $('#play').addClass('hidden');
                $('#pause').removeClass('hidden');
            }
            that.model.set({playState: state});
        });
        Backbone.pubSub.on('playingTrackChanged', function(track){
            var meta = track['name']+' - '+track['artist'];
            if(meta.length > 60){
                meta = meta.slice(0,60)+'...';
            }
            that.model.set({playingTrack: track});
            if($('#player-meta')) $('#player-meta').text(meta);
        });
        Backbone.pubSub.on('positionChanged', function(position){
            var time = parseInt(position);
            var dur = $('#player').data('duration');
            if (position > that.model.get('playingTrackDuration')-2){ /* skip 1-2 seconds early */
                that.sendNext();
                return;
            }
            var min = parseInt(time/60), sec = time % 60;
            if (sec < 10) sec = '0'+sec;
            $('#position').text(min + ':' + sec);
            $('#player-loading').width((time/parseFloat(dur))*600);
        });
    },
    sendPlay: function(){
        rdio_play();
    },
    sendPause: function(){
        rdio_pause();
    },
    sendNext: _debounce(function(){
        console.log('SEND NEXT');
        var index = this.model.get('playingIndex');
        //if (index === -1) index = 0;
        var $row = $($('.refine-row').get(parseInt(index)));/* bad line */
        var rdio = $row.data('rdio'), time = $row.data('time'), dur=$row.data('duration');
        this.model.set({playingIndex: index+1,
                        currentRdio: rdio,
                        playingTrackLength: time,
                        playingTrackDuration: dur});
        rdio_play(rdio);
        $('#player').data('duration', dur);
        Backbone.pubSub.trigger('renderPlaylists');
    }, 500),
    sendPrevious: function(){
        rdio_previous();
        // TODO
    }
});

var MoreByArtistView = Backbone.View.extend({
    el: $('#more-by-artist'),
    currentArtistId: null,
    currentQuery: null,
    currentSearchMatches: [],
    currArtist: '#more-by-artist #curr-artist',
    events: {
        'click .graph-add-btn:not(.disabled)': 'addSong',
        'click .graph-add-btn.disabled': 'refocusSearch',
        'click .graph-search-btn': 'startSearch',
        'input .graph-search-input': 'searchNodes',
        'click button.close': 'clearTooltips',
        'click .graph-method': 'changeMethod'
    },
    initialize: function(){
        var that = this;
        $('#more-by-artist').on('hidden', function(){
            that.clearTooltips();
        });
    },

    addSong: function(ev){
        var id = $('#modal-footer-memo').attr('data-id'), that = this;
        var index  = parseInt(this.$el.data('index'));
        this.clearTooltips();
        this.$el.modal('hide');
        $.get('/song-expand/?id='+id, function(data){
            var curr = that.model.get('currentSongList'), currDur = that.model.get('currentDuration');
            var newSong = _.extend(data.song, {justAdded: true}), newDur = data.song.audio_summary['duration'];
            curr.splice(index, 0, newSong);
            that.model.set({currentSongList: curr, 
                            currentTotalArtists: _.uniq(_.pluck(curr, 'artist_id')).length, 
                            currentDuration: currDur + newDur});
            Backbone.pubSub.trigger('songAdded');
        });
    },

    startSearch: function(ev){
        $('#modal-footer-memo').text('');
        $('.graph-search-input').val('');
        $('.graph-search-input').removeClass('hidden');
        $('.graph-search-input').focus();
        $('.graph-search-btn').removeClass('disabled');
        $('.graph-add-btn').addClass('disabled');
    },
    refocusSearch: function(ev){
        $('.graph-search-input').focus();
    },

    searchNodes: _debounce(function(ev){
        this.clearTooltips();
        var that = this, $el;
        if(ev){
            $el = $(ev.currentTarget);
        }else{
            $el = $('input.graph-search-input');
        }
        var q = $el.val().toLowerCase();
        if(q === '') return;
        this.currentQuery = q;
        var matches = _.filter($('circle'), function(item){
            var title = $(item).data('title').toString().toLowerCase();
            var trans = $(item).attr('transform').slice(10, -1).split(',');
            var w = parseInt(trans[0]), h = parseInt(trans[1]);
            if(title.search(q)>=0 && (w > 0 && w < 720) && (h > 0 && h < 346)) return true;
        });
        this.currentSearchMatches = matches;
        _.each(matches, function(match, key, list){
            $(match).tooltip('show');
        });
    }, 250),

    changeMethod: function(ev){
        var that = this;
        var art_name = $(this.currArtist).text();
        $('.graph-body').html(_.template($('#loading-graph').text()));
        $('.graph-method.selected').removeClass('selected');
        $(ev.currentTarget).addClass('selected');
        var metric = $(ev.currentTarget).attr('id');
        $.get('/artist-points/?id='+this.currentArtistId+'&metric='+metric, function(data){
            var dataset = data.points;
            that._drawGraph(dataset, {x_low: data.xLowLabel, x_high: data.xHighLabel, 
                                      y_low: data.yLowLabel, y_high: data.yHighLabel});
        });
    },

    clearTooltips: function(ev){
        $('.tooltip').remove();
    },

    newGraph: function(index, artid, art_name, graphMetric){
        var metric = graphMetric || 'energy-loud', that = this;
        $(this.currArtist).text(art_name);
        $('#modal-footer-memo').text('');
        $('input.graph-search-input').val('');
        $('.graph-body').html(_.template($('#loading-graph').text()));
        this.$el.data('index', index);
        this.$el.modal('show');
        this.currentArtistId = artid;
        $.get('/artist-points/?id='+artid+'&metric='+metric, function(data){
            var dataset = data.points;
            $('.graph-method.selected').removeClass('selected');
            $('.graph-method#'+metric).addClass('selected');
            that._drawGraph(dataset, {x_low: data.xLowLabel, x_high: data.xHighLabel, 
                                      y_low: data.yLowLabel, y_high: data.yHighLabel});
            that.startSearch();
        });
    },

    _drawGraph: function(dataset, labels){
        var svg, that = this;
        $('#more-by-artist .graph-body').html('');
        var songids = _.pluck(this.model.get('currentSongList'), 'id');
        var w = 720, h = 346;
        var x = d3.scale.linear().domain([0,w]).range([0,w]);
        var y = d3.scale.linear().domain([0,h]).range([0,h]);

        //Create SVG element
        svg = d3.select("#more-by-artist .graph-body")
                    .append("svg")
                    .attr("width", w)
                    .attr("height", h)
            .append("g")
                .attr("transform", "translate(" + 0 + "," + 0 + ")")
                .call(d3.behavior.zoom().x(x).y(y).scaleExtent([1, 8]).on("zoom", zoom));

        svg.append("rect")
            .attr("width", w)
            .attr("height", h)
            .attr("class", "viewport")
            .style("fill", "#fafafa");

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(-h);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(5)
            .tickSize(-w);
         
        // Draw Y-axis grid lines
        svg.selectAll("line.y")
          .data(y.ticks(8))
          .enter().append("line")
          .attr("class", "y")
          .attr("x1", 0)
          .attr("x2", w)
          .attr("y1", y)
          .attr("y2", y)
          .style("stroke", "#c8c8c8")
          .style("stroke-dasharray", "1, 1");

        svg.selectAll("line.x")
          .data(dataset)
          .enter().append("line")
          .attr("class", "x")
          .attr("x1", function(d){
             return x(d.point[0]); 
          })
          .attr("x2", function(d){
             return x(d.point[0]); 
          })
          .attr("y2", y(h))
          .attr("y1", function(d){
             return y(d.point[1]);
          })
          .style("stroke", "#c8c8c8")
          .style("stroke-dasharray", "1, 1");

        svg.selectAll("circle")
           .data(dataset)
           .enter()
           .append("circle")
           .attr("transform", function(d, i) {
                return "translate("+x(d.point[0])+","+y(d.point[1])+")";
           })
           .attr("r", 4)
           .attr("class", function(d){
                return (_.contains(songids, d.id) ? "blue-circle" : "gray-circle");
           })
           .attr("data-id", function(d){
                return d.id;
           })
           .attr("data-original-title", function(d){
                return d.display;
           }) 
           .attr("data-title", function(d){
                return d.title;
           });

        svg.append("text")
            .attr("class", "x label higher")
            .attr("text-anchor", "end")
            .attr("x", w)
            .attr("y", h - 6)
            .style("fill", "#8C8C8C")
            .text(labels.x_high);

        svg.append("text")
            .attr("class", "x label lower")
            .attr("text-anchor", "start")
            .attr("x", 10)
            .attr("y", h - 6)
            .style("fill", "#8C8C8C")
            .text(labels.x_low);

        svg.append("text")
            .attr("class", "y label higher")
            .attr("text-anchor", "end")
            .attr("x", -6)
            .attr("y", 10)
            .attr("transform", "rotate(-90)")
            .style("fill", "#8C8C8C")
            .text(labels.y_high);

        svg.append("text")
            .attr("class", "y label lower")
            .attr("text-anchor", "start")
            .attr("x", 10-(h-6))
            .attr("y", 10)
            .attr("transform", "rotate(-90)")
            .style("fill", "#8C8C8C")
            .text(labels.y_low);

        function zoom() {
            svg.selectAll("line.x")
              .attr("x1", function(d){
                 return x(d.point[0]); 
              })
              .attr("x2", function(d){
                 return x(d.point[0]); 
              })
              .attr("y2", h)
              .attr("y1", function(d){
                 return y(d.point[1]);
              })
              .data(dataset);
            svg.selectAll("circle")
                .attr("transform", function(d, i) {
                    return "translate("+x(d.point[0])+","+y(d.point[1])+")";
                })  
                .attr("class", function(d){
                    return (_.contains(songids, d.id) ? "blue-circle" : "gray-circle");
                })
                .data(dataset);
            _.each($('.blue-circle'), function(el, key, list){
                el.parentNode.appendChild(el);
            });
            that.clearTooltips();
            that.searchNodes();
        }
        that._svg = svg;
        _.each($('.blue-circle'), function(el, key, list){
            el.parentNode.appendChild(el);
        });
        $('circle').tooltip({trigger: 'manual', delay: { show: 300, hide: 100 }, container:'body', placement:'right'});
        $('circle').hover(function(){
            $(this).tooltip('show');
        },function(){
            if(!_.contains(that.currentSearchMatches, this)) $(this).tooltip('hide');
        });
        $('circle').click(function(){
            $('circle').css('fill','');
            $(this).css('fill','#FFAC29');
            $('.graph-search-input').addClass('hidden');
            $('#modal-footer-memo').html('<b>Add</b> "'+$(this).attr('data-title')+'" <b>to playlist?</b>');
            $('#modal-footer-memo').attr('data-id', $(this).attr('data-id'));
            // change from Search to Add
            $('.graph-search-btn').addClass('disabled');
            $('.graph-add-btn').removeClass('disabled');
        });
    }
});

var RefineOptions = Backbone.View.extend({
    el: $('body'),
    events: {
        'click .refine-option.more-by-artist': 'moreByArtist',
        'click .refine-option.ban-artist':     'banArtist'
    },
    moreByArtist: function(ev){
        Backbone.pubSub.trigger('refineMoreByArtist');
    },
    banArtist: function(ev){
        Backbone.pubSub.trigger('refineBanArtist');
    }
});

var DragDropView = Backbone.View.extend({
    el: $('#refine-right'),
    changed: false, 
    _initMoreByArtist: function(){
        this.moreByArtistView = new MoreByArtistView({model: this.model});
        this.refineOptions = new RefineOptions();
    },
    events:{
        'click div.export-btn':       'exportPlaylist',
        'click .refine-row':          'playSong',
        'mouseover .refine-row':      'showControls',
        'mouseout .refine-row':       'hideControls',
        'click .refine-btn-remove':   'removeTrack',
        'click .refine-btn-exchange': 'exchangeTrack',
        'click .refine-btn-more':     'showOptions',
        'click .extend-btn':          'showExtend',
        'click #idspaces':            'showIdspaces'
    },
    render: function(scrollTop){
        var that = this, _scrollTop = scrollTop || 0;
        var refine_pl = _.template($('#refine-playlist-view').text(), {model: this.model.toJSON()});
        if(this.model.get('currentSongList')){
            $('#refine-right').html(refine_pl);
            $('#refine-playlist-box').sortable({
                axis: "y",
                distance: 15,
                revert: 50,
                stop: function(ev, ui){
                    var dragIndex = parseInt($(ui.item).data('index'))-1;
                    var dropIndex = $('.refine-row').index(ui.item);
                    if ( dragIndex === dropIndex ) return;
                    var songs = that.model.get('currentSongList');
                    var spliced = songs.splice(dragIndex, 1);
                    songs.splice(dropIndex, 0, spliced[0]);
                    that.model.set('currentSongList', songs);
                    Backbone.pubSub.trigger('renderPlaylists');
                }
            }).disableSelection();
            $('.refine-btn-more').popover({
                container: 'body', 
                placement: 'bottom', 
                trigger:'manual', 
                delay: { 
                    show: 500, hide: 100 
                }});
            $('.refine-playlist-box').scrollTop(_scrollTop);
            this._player.render();
            this.detectPlayIndex();
        }
        $('.extend-btn').tooltip({placement:'top',trigger:'hover',delay:{show:200,hide:100}});
    },
    renderDetail: function(){
        var refine_detail = _.template($('#refine-view').text(),
                                {model: this.model.toJSON(), slider_texts: SLIDER_TEXTS});
        $('#refine-detail').html(refine_detail);
        _.each($('.refine-artist'), function(item,key,list){
            Backbone.pubSub.trigger('updateImg', item);
        });
    },
    initialize: function(){
        this._initMoreByArtist();
        this._player = new PlayerView({model: this.model});
        Backbone.pubSub.on('renderRefinePlaylist', function(){
            this.render($('#refine-playlist-box').scrollTop());
        }, this);
        Backbone.pubSub.on('refineMoreByArtist', this.moreByArtist, this); 
        Backbone.pubSub.on('refineBanArtist', this.banArtist, this); 
    },
    playSong: function(ev){
        var $row = $(ev.currentTarget);
        var time = $row.data('time'), dur = $row.data('duration'), index = $row.data('index'), rdio=$row.data('rdio');
        if(this.model.get('rdioReady')){
            rdio_play(rdio);
        }else{
            R.player.play({source: rdio});
        }
        $('#time').text(time);
        $('#player').data('duration', dur);
        $('.index-cell').css('display', 'block');
        $('.playing-cell').css('display', 'none');
        $(ev.currentTarget).children('.index-cell').css('display', 'none');
        $(ev.currentTarget).children('.playing-cell').css('display', 'block');
        this.model.set({currentRdio: rdio, playingTrackLength: time, playingTrackDuration: dur, playingIndex: index});
    },
    exportPlaylist: function(){
        var that = this;
        $('#export-playlist').html(_.template($('#export-modal-inner').text(),
                                        {model:this.model.toJSON()}));
        $('#export-playlist').modal('show');
        $('a.export-confirm').click(function(){
            that.sendExport();
        });
    },
    sendExport: function(){
        var name = $('input.export-name-input').val();
        if(name){
            var rdio_ids = _.map($('.refine-row'), function(el){
                return $(el).data('rdio');
            });
            $.get('/export/?tracks='+rdio_ids.join()+'&name='+name, function(data){
                var url = 'http://rdio.com'+data.url;
                $('#export-playlist').html(_.template($('#export-success').text(), {url:url, name:name}));
                $('#reset-app').one('click', function(){
                    $('#export-playlist').modal('hide');
                    Backbone.pubSub.trigger('resetApp');
                });
                $('#keep-editing').one('click', function(){
                    $('#export-playlist').modal('hide');
                });
                // TODO create a song-TP and populate it with the song list
            }); 
        }
    },
    showExtend: function(ev){
        $('#extend-length').modal('show');
        $('.drop-div-short').popover({container: 'body', 
                                      placement: 'bottom', 
                                      trigger:'manual', 
                                      delay: { show: 500, hide: 100 }});
        $('.extend-confirm, .drop-div-short').unbind('click');
        $('.extend-confirm').click(function(){
            $('#extend-length').modal('hide');
            var hours = parseInt($('.drop-div-short .pl-hour').text());
            var mins = parseInt($('.drop-div-short .pl-minute').text());
            Backbone.pubSub.trigger('loading', true);
            Backbone.pubSub.trigger('extendPlaylist', hours*60+mins);
        });
        $('.drop-div-short').click(function(){
            var that = this, type = $(this).data('type'), off = $(this).offset();
            if($('.popover').length){
                $('.drop-div-short').popover('hide'); 
                return;
            }
            $(this).popover('toggle');
            $('.popover-content').html(_.template($('#drop-div-'+type).text(), {}));
            $('.popover').css('z-index', '1060').css('top', off.top+51).css('left', off.left-35);
            $('.popover .arrow').css('left', 167).css('z-index', '1060');
            $('.drop-div-item').unbind('click');
            $('.drop-div-item').click(function(){
                $(that).children('.pl-'+type).text($(this).children('.val').text());
                $('.drop-div-short').popover('hide'); 
            });
        });
    },
    showIdspaces: function(ev){
        Backbone.pubSub.trigger('loading', true);
        var soids = _.pluck(this.model.get('currentSongList'), 'id');
        $.post('/idspaces-summary/', {ids: soids.join()},
            function(data){
                Backbone.pubSub.trigger('doneLoading', function(){ 
                    $('#idspaces-grid').html(_.template($('#idspaces-grid-view').text(), _.extend({soids:soids}, data)));
                    $('#idspaces-modal').modal('show');
                });
            });
    },
    showControls: function(ev){
        $(ev.currentTarget).children('.length-cell').addClass('hidden');
        $(ev.currentTarget).children('.refine-ctls-cell').removeClass('hidden');
    },
    hideControls: function(ev){
        $(ev.currentTarget).children('.length-cell').removeClass('hidden');
        $(ev.currentTarget).children('.refine-ctls-cell').addClass('hidden');
    },
    removeTrack: function(ev){
        var $row = $(ev.target).parents('.refine-row');
        var dur = $row.data('duration'), songs = this.model.get('currentSongList');
        songs.splice($row.data('index')-1, 1);
        this.model.set({currentTotalArtists: _.uniq(_.pluck(songs, 'artist_id')).length,
                        currentSongList: songs,
                        currentDuration: parseFloat(this.model.get('currentDuration')-dur)});
        Backbone.pubSub.trigger('renderPlaylists');
        ev.stopPropagation();
    },
    detectPlayIndex: function(){
        var index = $('.refine-row').index($('.playing'));
        this.model.set({playingIndex: index+1}); /* 1-based */
    },
    showOptions: function(ev){
        var $tgt = $(ev.currentTarget);
        var top = $tgt.offset().top, left = $tgt.offset().left;
        $tgt.popover('toggle');
        this.$activeTgt = $tgt;
        $('.popover-content').html(_.template($('#refine-options').text(), {}))
                 .css('height', 'auto').css('background-color', '#00ACEB').css('border-top-color', '#00ACEB');
        $('.popover').css('top', top+15).css('left', left-160);    /*15);*/
        $('.popover .arrow').css('border-bottom-color', '#00ACEB').css('left', 170);
        $tgt.parents('.refine-row').addClass('selected');
        var hide_popover = function(){
            $tgt.popover('hide');
            $tgt.parents('.refine-row').removeClass('selected');
        };
        $('.popover-content').mouseleave(hide_popover);
        $('.refine-row').mouseenter(hide_popover);
        ev.stopPropagation();
    },
    moreByArtist: function(ev){
        this.$activeTgt.popover('hide');
        var $row = this.$activeTgt.parents('.refine-row');
        var artid = $row.data('en'), art_name = $row.data('artist-name'), index = $row.data('index');
        this.moreByArtistView.newGraph(index, artid, art_name);
    },
    banArtist: function(ev){
        this.$activeTgt.popover('hide');
        var $row = this.$activeTgt.parents('.refine-row');
        var deletes = $('.refine-row[data-en="'+$row.data('en')+'"]');
        var songs = this.model.get('currentSongList'), newDur = this.model.get('currentDuration');
        var bans = this.model.get('artistBans');
        _.each(deletes, function(item, key, list){
            newDur -= $(item).data('duration');
        });
        songs = _.filter(songs, function(it){ return it.artist_id !== $row.data('en'); });
        bans.push($row.data('artist-name'));
        this.model.set({currentTotalArtists: _.uniq(_.pluck(songs, 'artist_id')).length,
                        currentSongList: songs,
                        currentDuration: newDur,
                        artistBans: bans});
        this.render($('#refine-playlist-box').scrollTop());
        this.renderDetail();
    }
});

