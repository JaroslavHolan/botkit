/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var request = require('request');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();


controller.hears(['ahoj', 'čau', 'cau'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Ahoj ' + user.name + '!!');
        } else {
            bot.reply(message, 'Ahoj.');
        }
    });
});

controller.hears(['help|pomoc'], 'direct_message,direct_mention,mention', function (bot, message) {

    controller.storage.users.get(message.user, function (err, user) {
        bot.reply(message, 'Zkus něco z toho: ' +
            '\n- Ahoj ' +
            '\n- verze WebAPI' +
            '\n- Kolik mám na účtu? | zůstatek | zustatek' +
            '\n- Jaké mám číslo účtu? | číslo účtu | cislo uctu' +
            '\n- Kdo jsi? | Kdo jsem?'
        );

    });
});

controller.hears(['verze WebAPI'], 'direct_message,direct_mention,mention', function (bot, message) {

    controller.storage.users.get(message.user, function (err, user) {
        var options = {
            url: 'https://www.csas.cz/webapi/api/v1/version'
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var version = JSON.parse(body).version
                var java = JSON.parse(body).java
                bot.reply(message, 'Toto je WebAPI verze  *' + version + '*. \nBěží na Javě *' + java + '*.');
            }
        }

        request(options, callback);

    });
});

controller.hears(['Kolik mám na účtu?|zůstatek|zustatek'], 'direct_message,direct_mention,mention', function (bot, message) {

    controller.storage.users.get(message.user, function (err, user) {
        var options = {
            url: 'https://api.csas.cz/sandbox/webapi/api/v3/netbanking/my/accounts?size=100&page=0&sort=iban&order=desc&type=CURRENT',
            headers: {
                'WEB-API-key': '35bd5a35-5909-460e-b3c2-20073d9c4c2e',
                'Authorization': 'Bearer demo_001',
                'Accept': 'application/json'
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var account = JSON.parse(body).accounts.find(findCurrent)
                if (typeof account != 'undefined') {
                    var value = account.balance.value
                    var currency = account.balance.currency
                    bot.reply(message, 'Zůstatek na účtu je *' + value + ' ' + currency + '*.');
                } else {
                    bot.reply(message, 'Zůstatek na účtu je nenalezen.');
                }
            }
        }

        function findCurrent(account) {
            return account.type == 'CURRENT';
        }

        request(options, callback);

    });
});

controller.hears(['Jaké mám číslo účtu?|číslo účtu|cislo uctu'], 'direct_message,direct_mention,mention', function (bot, message) {

    controller.storage.users.get(message.user, function (err, user) {
        var options = {
            url: 'https://api.csas.cz/sandbox/webapi/api/v3/netbanking/my/accounts?size=100&page=0&sort=iban&order=desc&type=CURRENT',
            headers: {
                'WEB-API-key': '35bd5a35-5909-460e-b3c2-20073d9c4c2e',
                'Authorization': 'Bearer demo_001',
                'Accept': 'application/json'
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var account = JSON.parse(body).accounts.find(findCurrent)
                if (typeof account != 'undefined') {
                    var number = account.accountno.number
                    var bankCode = account.accountno.bankCode
                    var currency = account.balance.currency
                    bot.reply(message, 'Tvé číslo účtu je *' + number + '/' + bankCode + '*.');
                } else {
                    bot.reply(message, 'Tvé číslo účtu nebylo nalezeno.');
                }
            }
        }

        function findCurrent(account) {
            return account.type == 'CURRENT';
        }

        request(options, callback);

    });
});

controller.hears(['Jaké mám účty?|seznam účtů|seznam uctu|účty|ucty'], 'direct_message,direct_mention,mention', function (bot, message) {

    controller.storage.users.get(message.user, function (err, user) {
        var options = {
            url: 'https://api.csas.cz/sandbox/webapi/api/v3/netbanking/my/accounts?size=100&page=0&sort=iban&order=desc&type=CURRENT',
            headers: {
                'WEB-API-key': '35bd5a35-5909-460e-b3c2-20073d9c4c2e',
                'Authorization': 'Bearer demo_001',
                'Accept': 'application/json'
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var text = 'Tvé účty jsou:'
                var accounts = JSON.parse(body).accounts
                var len = accounts.length;
                for (i = 0; i < len; i++) {
                    text += '\n- ' + accounts[i].productI18N
                }
                bot.reply(message, text)
            }
        }

        request(options, callback);

    });
});


controller.hears(['rikej mi (.*)', 'Moje jmeno je (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['Kdo jsem?'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Říkám ti ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('Ještě neznám tvé jméno!');
                    convo.ask('Jak bych ti měl říkat?', function(response, convo) {
                        convo.ask('Chceš po mě, abych ti říkal `' + response.text + '`?', [
                            {
                                pattern: 'jo',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'ne',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! Zapamatuji si to.');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Mám to. Budu ti říkat ' + user.name + ' od teď.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevadí.');
                        }
                    });
                }
            });
        }
    });
});


controller.hears(['Kdo jsi?', 'Jak se jmenuješ?'], 'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: Jsem chatbot <@' + bot.identity.name +
             '>. Tvůj internetový bankéř.');

    });

function formatUptime(uptime) {
    var unit = 'sekund';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minut';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hodin';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
