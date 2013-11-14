/*
Copyright (c) 2011 Rdio Inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

// a global variable that will hold a reference to the api swf once it has loaded
window.apiswf = null;

$(document).ready(function() {
  // on page load use SWFObject to load the API swf into div#apiswf
  var flashvars = {
    'playbackToken': playback_token, // from token.js
    'domain': domain,                // from token.js
    'listener': 'callback_object'    // the global name of the object that will receive callbacks from the SWF
    };
  var params = {
    'allowScriptAccess': 'always'
  };
  var attributes = {};
  swfobject.embedSWF('http://www.rdio.com/api/swf/', // the location of the Rdio Playback API SWF
      'apiswf', // the ID of the element that will be replaced with the SWF
      1, 1, '9.0.0', 'expressInstall.swf', flashvars, params, attributes);

});

  // set up the controls
  //$('.playlist-row').click(function() {
  //  apiswf.rdio_play($(this).data('rdio'));
  //});

//  $('#stop').click(function() { apiswf.rdio_stop(); });
//  $('#pause').click(function() { apiswf.rdio_pause(); });
//  $('#previous').click(function() { apiswf.rdio_previous(); });
//  $('#next').click(function() { apiswf.rdio_next(); });

// the global callback object
var callback_object = {};

callback_object.ready = function ready(user) {
  // Called once the API SWF has loaded and is ready to accept method calls.

  // find the embed/object element
  apiswf = $('#apiswf').get(0);

  apiswf.rdio_startFrequencyAnalyzer({
    frequencies: '10-band',
    period: 20
  });

  Backbone.pubSub.trigger('rdioReady');
}

callback_object.freeRemainingChanged = function freeRemainingChanged(remaining) {
  //$('#remaining').text(remaining);
}

callback_object.playStateChanged = function playStateChanged(playState) {
  // The playback state has changed.
  // The state can be: 0 - paused, 1 - playing, 2 - stopped, 3 - buffering or 4 - paused.
  //$('#playState').text(playState);
  Backbone.pubSub.trigger('playStateChanged', playState);
  console.log('playState');
  console.log(playState);
}

var currentTrack;
callback_object.playingTrackChanged = function playingTrackChanged(playingTrack, sourcePosition) {
  // The currently playing track has changed.
  // Track metadata is provided as playingTrack and the position within the playing source as sourcePosition.
  //if (playingTrack != null) {
    //console.log(playingTrack);
    //currentTrack = playingTrack;
    //$('#track').text(playingTrack['name']);
    //$('#album').text(playingTrack['album']);
    //$('#artist').text(playingTrack['artist']);
    //$('#art').attr('src', playingTrack['icon']);
  //}
  Backbone.pubSub.trigger('playingTrackChanged', playingTrack);
  console.log('playingTrack');
  console.log(playingTrack);
}

callback_object.playingSourceChanged = function playingSourceChanged(playingSource) {
  // The currently playing source changed.
  // The source metadata, including a track listing is inside playingSource.
  console.log('playingSrc');
  console.log(playingSource);
}

callback_object.volumeChanged = function volumeChanged(volume) {
  // The volume changed to volume, a number between 0 and 1.
}

callback_object.muteChanged = function muteChanged(mute) {
  // Mute was changed. mute will either be true (for muting enabled) or false (for muting disabled).
}

callback_object.positionChanged = function positionChanged(position) {
  //The position within the track changed to position seconds.
  // This happens both in response to a seek and during playback.
  //$('#position').text(position);
  //$('#inner').width((position/currentTrack['duration'])*$('#outer').width());
  Backbone.pubSub.trigger('positionChanged', position);
}

callback_object.queueChanged = function queueChanged(newQueue) {
  // The queue has changed to newQueue.
}

callback_object.shuffleChanged = function shuffleChanged(shuffle) {
  // The shuffle mode has changed.
  // shuffle is a boolean, true for shuffle, false for normal playback order.
}

callback_object.repeatChanged = function repeatChanged(repeatMode) {
  // The repeat mode change.
  // repeatMode will be one of: 0: no-repeat, 1: track-repeat or 2: whole-source-repeat.
}

callback_object.playingSomewhereElse = function playingSomewhereElse() {
  // An Rdio user can only play from one location at a time.
  // If playback begins somewhere else then playback will stop and this callback will be called.
  alert("Playback stopped because your account is being used somewhere else");
}

callback_object.updateFrequencyData = function updateFrequencyData(arrayAsString) {
  // Called with frequency information after apiswf.rdio_startFrequencyAnalyzer(options) is called.
  // arrayAsString is a list of comma separated floats.

  //var arr = arrayAsString.split(',');

  //$('#freq div').each(function(i) {
  //  $(this).width(parseInt(parseFloat(arr[i])*50));
  //})
  Backbone.pubSub.trigger('freqData', arrayAsString);
}
//typeahead();

/*
function typeahead(){
    var init = this;
    $('.typeahead').multisuggest({
        sources: [
            {
                data: "/typeahead/",
                queryParam: "query",
                type: "url",
                listFormatter: function(item, term){
                    return item.name;
                },
                inputFormatter: function(item, term){
                    return item.name+' ('+item.id+')';
                },
                valueAttribute: function(item) {
                    return item.id;
                },
                resultsProcessor: function(data) {
                    return data.items;
                },
                header: 'Artists/Songs',
                maxEntries: 20
            },
        ],
        loadingIconClass: "usuggest-loading",
        noResultsText: "No matching results.",
        enableDropdownMode: true,
        delay: 50,
        minLength: 2,
    });

    $('.typeahead').change(function(){
        var typed_val = $(this).val();
        var prefix = typed_val.substring(0,2);
        var prefixed = prefix === 'CA' || prefix === 'AR' || prefix === 'SO';
        if(typed_val.length === 18 && prefixed){
            $('.msuggest-hiddeninput').val(typed_val);
            init.load_enid(typed_val);
        } else {
            var enid = init.find_enid(typed_val);
            if(enid){
                init.load_enid(enid);
            }
        }
    });
}
*/


function rdio_play(id){
    apiswf.rdio_play(id);
}
function rdio_pause(){
    apiswf.rdio_pause();
}
function rdio_queue(id){
    apiswf.rdio_queue(id);
}
function rdio_playQueuedTrack(pos, off){
    console.log('playing Queued Track !!!');
    apiswf.rdio_playQueuedTrack(pos, off);
}
function rdio_next(){
    apiswf.rdio_next();
}
function rdio_previous(){
    apiswf.rdio_previous();
}
function rdio_seek(pos){
    apiswf.rdio_seek(pos);
}
function rdio_clearQueue(){
    apiswf.rdio_clearQueue();
}
function rdio_sendState(){
    apiswf.rdio_sendState();
}
