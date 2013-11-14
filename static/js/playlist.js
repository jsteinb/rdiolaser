// playlist.js
var PlaylistSong = Backbone.Model.extend({});
var Playlist = Backbone.Collection.extend({
    model: PlaylistSong
});

var ControlState = Backbone.Model.extend({
    defaults: {
        currentType: null,
        artistSeeds: [null, null, null, null, null],
        trackSeeds: [],
        genreSeeds: [],
        playlistSeed: null,
        artistBans: [],
        boosts: [],
        excludes: [],
        currentFilters: [],
        currentArtistList: null,
        currentSongList: null,
        artistImgs: {},
        rdioReady: false,
        recalc: false,
        playingTrack: null,
        playingTrackLength: '0:00',
        playState: 0
    },
    reset: function(){
        var rdio = this.get('rdioReady');
        this.clear();
        this.set({
            currentType: null,
            artistSeeds: [null, null, null, null, null],
            trackSeeds: [],
            genreSeeds: [],
            playlistSeed: null,
            artistBans: [],
            boosts: [],
            excludes: [],
            currentFilters: [],
            currentArtistList: null,
            currentSongList: null,
            artistImgs: {},
            rdioReady: rdio,
            recalc: false,
            playingTrack: null,
            playingTrackLength: '0:00',
            playState: 0
        })
    }
});
