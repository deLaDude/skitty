(function () {
  // import core modules
  var mongojs = require("mongojs"),
      PlugBot = require('./plugBot').Bot,
      StatsDb = require('./modules/core/statsDb').StatsDb,

      // import bot plugin modules
      Skitty =      require('./modules/skitty').Skitty,
      InfoPlugin =  require('./modules/info').InfoPlugin,
      Dj =          require ('./modules/dj').Dj,
      StatTracker = require('./modules/statTracker').StatTracker,
      KillSwitch =  require('./modules/killSwitch').KillSwitch,
      Curmudgeon =      require('./modules/curmudgeon').Curmudgeon,

      // import other modules
      TurntableStats = require('./modules/ttApi').TurntableStats,

      // import resources
      resources = {
        info:           require('./resources/info'),
        gifs:           require('./resources/gifs'),
        quotes:         require('./resources/quotes'),
        funnyResponses: require('./resources/funny_responses'),
        dj:             require('./resources/dj'),
        stats:          require('./resources/stats'),
        facts:          require('./resources/facts'),
        curmudgeon:     require('./resources/curmudgeon')
      };
  
  // determine stats db: check env first, fallback on development db
  var statsDb;
  if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES),
        mongo = env['mongodb-1.8'][0]['credentials'];
    
    statsDb = mongo.url;
  } else {
    statsDb = 'mongodb://<user>:<password>@linus.mongohq.com:10065/tt-db';
  }

  // define bot model
  var model = {
        room: 'coding-soundtrack-lounge',
        updateCode: '_:8s[H@*dnPe!nNerEM', 
        auth: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        reconnectDelay: 1000,
        reconnectAttempts: 5 
      },
  
      // create plugins
      plugins = [ 
        new Skitty({
          resources: resources
        }),
        new Dj({ 
          defaultPlaylist: 'snags',
          autoDj: true,
          autoDjThreshold: 0,
          resources: {
            generic: resources.info,
            dj: resources.dj
          }
        }),
        new StatTracker({
          announcePlayStats: false,
          announceSongPlay: true,
          resources: {
            generic: resources.info,
            stats: resources.stats
          },
          stats: new StatsDb({ db: mongojs.connect(statsDb, ['songPlays']) })
        }),
        new InfoPlugin({ 
          resources: resources.info
        }),
        new KillSwitch({
          timeout: 5000,
          resources: resources.info.killSwitch
        }),
        new Curmudgeon({
          resources: resources.curmudgeon
        })
      ];

  // run bot
  var skitty = new PlugBot(model, plugins);
    
  // start webserver
  var express = require('express'),
      app = express();
  
  app.get('/', function(req, res) {
    res.send('meow.');
  });

  // enable turntable stats api
  // var ttApi = new TurntableStats(app, mongojs.connect(statsDb, ['plays', 'hearts']));
  
  app.listen(process.env.VCAP_APP_PORT || 3000);
}());
