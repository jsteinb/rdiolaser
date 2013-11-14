(function($){
    var App = Backbone.View.extend({

        _initElements: function(){
            this.control = new ControlState();
            this.nav = new NavigationView({model: this.control}); 
            this.auth = new RdioView(); 
            this.seedType = new SeedTypeView();
            this.artistInput = new ArtistSeedInputView({model: this.control});
            this.trackInput = new TrackSeedInputView({model: this.control}); 
            this.playlist = new PlaylistView({model: this.control});
            this.filters = new FilterView({model: this.control});
            this.dragdrop = new DragDropView({model: this.control});
        },

        initialize: function(){
            this._initElements();
            Backbone.pubSub.on('loading', this.startLoad, this);
            Backbone.pubSub.on('doneLoading', this.endLoad, this);
            Backbone.pubSub.on('loadingBg', this.startLoadBg, this);
            Backbone.pubSub.on('doneLoadingBg', this.endLoadBg, this);
            Backbone.pubSub.on('updateImg', this.updateImg, this);
            Backbone.pubSub.on('selectType', this.selectType, this);
            Backbone.pubSub.on('updateDetail', this.updateDetail, this);
            Backbone.pubSub.on('updateArtistSeeds', this.updateArtistSeeds, this);
            Backbone.pubSub.on('updateTrackSeeds', this.updateTrackSeeds, this);
            Backbone.pubSub.on('updateGenreSeeds', this.updateGenreSeeds, this);
            Backbone.pubSub.on('songAdded', this.songAdded, this);
            Backbone.pubSub.on('queueRecalc', this.queueRecalc, this);
            Backbone.pubSub.on('rdioChanged', this.rdioChanged, this);
            Backbone.pubSub.on('rdioReady', this.rdioReady, this);
            Backbone.pubSub.on('extendPlaylist', this.extendPlaylist, this);
            Backbone.pubSub.on('resetSeedsBoard', this.resetSeedsBoard, this);  
            Backbone.pubSub.on('resetAll', this.resetAll, this);  
            Backbone.pubSub.on('queueToPlayer', this.queueToPlayer, this);  
            Backbone.pubSub.on('renderPlaylists', this.renderPlaylists, this);  
            Backbone.pubSub.on('resetApp', this.resetApp, this);
        },

        selectType: function(type){
            this.control.reset();
            this.playlist.reset();
            this.control.set('currentType', type);
            switch (type){
                case 'artist':
                    this.artistInput.render(); break;
                case 'track':
                    if('trackInput' in this) this.trackInput.render(); 
                    else this.trackInput = new TrackSeedInputView({model: this.control}); 
                    break;
                case 'genre':
                    if('genreInput' in this) this.genreInput.render();
                    else this.genreInput = new GenreSeedInputView({model: this.control});
                    break;
                case 'playlist':
                    if('playlistInput' in this) this.playlistInput.render();
                    else this.playlistInput = new PlaylistSeedInputView({model: this.control});
                    break;
            }
            this.detail = new DetailView({el: $('#playlist-detail'), model: this.control});
            this.detail.clear();
            this.detail.render();
            this.nav.resetSideNav();
        },
        resetApp: function(){
            this.control.reset();
            this.playlist.reset();
            this.nav.reset();
        },
        updateDetail: function(genres, scores){
            console.log('updating detail');
            if(!('detail' in this)){
                console.log('remake detail');
                this.detail = new DetailView({el: $('#playlist-detail'), model: this.control});
                this.detail.render();
            }
            if(genres && scores){
                console.log('render genres');
                this.detail.reset(genres, scores);
            }else{
                console.log('reset');
                this.detail.reset();
            }
        },

        updateArtistSeeds: function(index, name){
            if(name){
                var curr = this.control.get('artistSeeds');
                curr[index] = name;
                this.control.set('artistSeeds', curr);
                var ctl = $('.artist-ctl').get(index);
                $(ctl).attr('data-original-title', name);
                $(ctl).tooltip({trigger: 'hover', delay: { show: 500, hide: 100 }});
            }
            this.artistInput.updateImg($('.artist-ctl img').get(index), index); 
        },

        updateTrackSeeds: function(id, artist_id, disp){
            if(id){
                var curr = this.control.get('trackSeeds');
                if(curr.length >= 5){
                    alert("You already have 5 tracks.");
                    return;
                }
                curr.push({'id':id, 'display':disp});
                this.control.set('trackSeeds', curr);
            }
            this.trackInput.renderSeeds();
        },

        updateGenreSeeds: function(name){
            if(name){
                var curr = this.control.get('genreSeeds');
                curr.push(name.toLowerCase());
                this.control.set({genreSeeds: curr});
            }
            this.genreInput.renderSeeds();
        },

        startLoad: function(move){
            this.nav._loading = true;
            this.nav.resetSideNav();
            $('#base-right, #refine-right').css('opacity', '0.2');
            if(this.nav.currentNav === 'topbar-nav-refine'){
                $('#loading-box').css('left', '60');
            }else{
                $('#loading-box').css('left', '260');
            }
            if($('#loading-box').css('display') === 'none'){
                $('#loading-box').fadeIn(200);
            }
            $('#loading-bar').stop();
            $('#loading-bar').css('width', '0px');
            if(move){
                $('#loading-bar').animate({'width': '192px'}, 16000);
            }
        },

        endLoad: function(callback){
            var that = this;
            console.log('end load');
            $('#loading-bar').stop();
            $('#loading-bar').animate({'width': '192px'}, 200, function(){
                $('#loading-box').fadeOut(200, function(){
                    that.nav._loading = false;
                    callback();
                    $('#base-right, #refine-right').css('opacity', '1');
                    $('#loading-bar').css('width', '0px')
                    that.nav.resetSideNav();
                });
            });
        },

        startLoadBg: function(){
            $('#loader').removeClass('hidden');
            this.nav._loading = true;
        },

        endLoadBg: function(callback){
            $('#loader').addClass('hidden');
            this.nav._loading = false;
            this.nav.resetSideNav();
            callback();
        },

        updateImg: function(el){
            console.log('updatin an image!!');
            var name = $(el).data('name');
            var library = this.control.get('artistImgs');
            if(name in library){
                $(el).find('img.unset').attr('src', library[name]);
                $(el).find('img.unset').removeClass('unset');
            }else{
                var that = this;
                console.log("fetch!");
                $.get('/artist-img/?name='+name, function(data){
                    $(el).find('img.unset').attr('src',data.url);
                    library[name] = data.url;
                    that.control.set('artistImgs', library);
                });
            }
        },

        songAdded: function(){
            this.renderPlaylists();
            //$('.just-added').animate({opacity:1}, 1000);
            $('.just-added').addClass('animated bounceIn');
            $('.just-added').removeClass('just-added');
            var songlist = this.control.get('currentSongList');
            this.control.set({
                currentSongList: _.map(songlist, function(it){return _.omit(it, 'justAdded')})
            });
        },

        queueRecalc: function(){
            this.control.set({recalc: true});
        },

        rdioChanged: function(ind){
            this.playlist.currentRdio = ind;
        },

        rdioReady: function(){
            this.control.set({rdioReady: true});
        },

        extendPlaylist: function(minutes){
            var mins = minutes || 30;
            var res = parseInt(mins/4).toString(), min = mins.toString();
            this.playlist.gather_songs(this.playlist.session_id, res, mins, true);
        },
    
        resetSeedsBoard: function(){
            var type = this.control.get('currentType');
            if(type === 'genre'){
                this.genreInput.render();
            }else{
                this.nav.resetSeedsBoard(type);
            }
        },

        resetAll: function(){
            this.initialize();
        },
        
        queueToPlayer: function(keys){
            this.dragdrop.player._queueToPlayer(keys);
        },

        renderPlaylists: function(){
            this.dragdrop.render($('#refine-playlist-box').scrollTop());
            if(this.nav.currentNav === 'topbar-nav-filter'){
                this.playlist.render($('#playlist-box').scrollTop());
            }
        }
    });

    var app = new App();

})(jQuery);
