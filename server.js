var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var getRelatedArtist = function(id){
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists/' + id + '/related-artists')
        .end(function(response) {
            if(response.ok){
                emitter.emit('end2', response.body);
            }
            else{
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var resultArray = [];
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        var id = item.artists.items[0].id;
        var searchReqNew = getRelatedArtist(id);
        resultArray.push(artist);
        
        searchReqNew.on('end2', function(item){
            for(i = 0; i < item.artists.length; i++){
                resultArray.push(item.artists[i]);  
            }
            console.log(resultArray);
            res.json(resultArray);
        });
        
        searchReqNew.on('error', function(code) {
            res.sendStatus(code);
        });
    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
    
});

app.listen(process.env.PORT || 8080);