import random
import urllib
from collections import defaultdict
from xml.etree import ElementTree as et
import hashlib

from flask import Flask, session, redirect, request, render_template, jsonify, send_file, abort
from flask.ext.assets import Environment, Bundle
from flask.ext.oauth import OAuth
from flask.ext.seasurf import SeaSurf
from rdioapi import Rdio
import requests
import simplejson as json
#import grequests

API_BASE = "http://developer.echonest.com/api/v4"
API_KEY = "Z5BUWFNXJP6NGXADB"
CONSUMER_KEY = "beb95zvaemkyn5gytq7nused"
CONSUMER_SECRET = "hX6R5HAMFz"

CONF = {'DOMAIN': 'localhost'}

app = Flask(__name__)
app.config['DEBUG'] = True

TRACKS = ['t37287272','t32313249','t32961632','t35956546']

def _get_rdio(cookies):
    if 'ot' in request.cookies and 'ots' in request.cookies:
        data = {'access_token': {'oauth_token': str(request.cookies['ot']),
                                 'oauth_token_secret': str(request.cookies['ots'])}}
        return Rdio(CONSUMER_KEY, CONSUMER_SECRET, data)
    elif 'rt' in request.cookies and 'rts' in request.cookies:
        data = {'request_token': {'oauth_token': str(request.cookies['rt']),
                                  'oauth_token_secret': str(request.cookies['rts']),
                                  'login_url': 'https://www.rdio.com/oauth/authorize/',
                                  'oauth_callback_confirmed': 'true'}}
        return Rdio(CONSUMER_KEY, CONSUMER_SECRET, data)
    else:
        return Rdio(CONSUMER_KEY, CONSUMER_SECRET, {})

@app.route('/')
def index():
    if 'ot' in request.cookies and 'ots' in request.cookies:
        RDIO = _get_rdio(request.cookies)
        if 'localhost' in CONF['DOMAIN']:
            token = None
        else:
            token  = RDIO.getPlaybackToken(domain=CONF['DOMAIN'].split(':')[0])
        key = request.args.get('key', None)
        i = None
        if key is None:
            i = request.args.get('i', 0)
            key = TRACKS[int(i)]
        return render_template('index.html', key=key, index=i, token=token, api_base=API_BASE, 
            setToken=('localhost' not in CONF['DOMAIN']),
            debug=int('debug' in request.args),
            domain=CONF['DOMAIN'].split(':')[0])
    else:
        return redirect('/rdio-auth/')

@app.route('/get-beats/<key>/')
def get_beats(key):
    try:
        fd = open('static/data/{0}.json'.format(key))
        data = json.loads(fd.read())
    except IOError:
        fid = 'rdio-US:track:{0}'.format(key)
        print fid
        url = '{0}/track/profile?id={1}&api_key={2}&bucket=audio_summary'.format(API_BASE, fid, API_KEY)
        r = requests.get(url)
        print r.json()
        analysis = r.json()['response']['track']['audio_summary']['analysis_url']
        r = requests.get(analysis)
        data = r.json()
    return jsonify({'beats': data['beats'], 'segs': data['segments'], 'bars':data['bars'], 'duration':data['track']['duration']})

@app.route('/get-yeezus/')
def get_yeez():
    fd = open('static/yeezus.json')
    data = json.loads(fd.read())
    return jsonify({'beats': data['beats'], 'segs': data['segments'], 'bars':data['bars']})

@app.route('/rdio-auth/')
def rdio_authenticate():
    RDIO = _get_rdio(request.cookies)
    token_dict = RDIO.begin_authentication("{0}/finish-auth/".format(REDIRECT_URL))
    rt = RDIO.__dict__['_Rdio__data_store']['request_token']['oauth_token']
    rts = RDIO.__dict__['_Rdio__data_store']['request_token']['oauth_token_secret']
    resp = app.make_response(redirect(token_dict))
    resp.set_cookie('rt', value=rt)
    resp.set_cookie('rts', value=rts)
    return resp

@app.route('/finish-auth/')
def rdio_finish_auth():
    RDIO = _get_rdio(request.cookies)
    verifier = request.args.get('oauth_verifier')
    token = request.args.get('oauth_token')
    RDIO.complete_authentication(verifier)
    ot = RDIO.__dict__['_Rdio__data_store']['access_token']['oauth_token']
    ots = RDIO.__dict__['_Rdio__data_store']['access_token']['oauth_token_secret']
    resp = app.make_response(redirect('/'))
    resp.set_cookie('ot', value=ot)
    resp.set_cookie('ots', value=ots)
    return resp

@app.route('/helper/')
def helper_index():
    return render_template('helper.html')

@app.route('/static/<path>')
def static_serve(path):
    send_file('static/%s' % path, cache_timeout=0)

if __name__ == "__main__":
    app.run('0.0.0.0', debug=True)
