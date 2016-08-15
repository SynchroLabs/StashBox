var path = require('path');
var nconf = require('nconf');

var logger = require('log4js').getLogger("config");

// Get config - precendence: command line (represented by "overrides" from caller), environment, JSON config file, defaults
//
exports.getConfig = function(configFile, overrides)
{
    var conf = new nconf.Provider();

    // 1) Overrides (from the command line)
    //
    if (overrides)
    {
        conf.overrides(overrides);
    }

    // 2) Environment vars
    //
    // nconf.env();
    //
    // Parse env vars that start with "STASHBOX__", with segments separated by "__", remove the prefix, put the values
    // into a memory store, and make it read-only...
    //
    conf.use("memory");
    var memStore = conf.stores["memory"];
    var mountsCreated = false;
    Object.keys(process.env).filter(function (key)
    {
        // We're only going to take env variables that start with "SYNCHRO__"...
        //
        return key.indexOf("STASHBOX__") == 0;
    }).forEach(function (key) 
    {
        // Convert env var string values of true/false/null to native values
        //
        var value = process.env[key];
        if (value == "true")
        {
            value = true;
        }
        else if (value == "false")
        {
            value = false;
        }
        else if (value == "null")
        {
            value = null;
        }

        // We're going to use "__" as the separator for the env variable name, and we're going to prune off
        // the "STASHBOX" part, and then create a normal colon-separated path from the remaining parts...
        //
        var key = key.split("__").slice(1).join(":");

        if ((key.indexOf("mounts:") == 0) && !mountsCreated)
        {
            memStore.set("mounts", []);
            mountsCreated = true;
        }

        logger.debug("Setting key: %s, value: %s", key, value);
        memStore.set(key, value);
    });
    memStore.readOnly = true;

    // 3) JSON config file
    //
    if (configFile)
    {
        conf.configDetails = "Using configuration file specified on command line: " + configFile;
        conf.file('config.json', configFile);
    }
    else if (process.env['STASHBOX_CONFIG'])
    {
        conf.configDetails = "Using configuration file specified in STASHBOX_CONFIG: " + process.env['STASHBOX_CONFIG'];
        conf.file('config.json', process.env['STASHBOX_CONFIG']);
    }
    else
    {
        conf.configDetails = "Using default configuration file: config.json";
        conf.file('config.json', 'config.json');
    }
    
    // 4) Default values
    //
    var defaults = 
    {
        'PORT': 80,
        'LOG4JS_CONFIG': 
        { 
            // Redirect console.log to log4js, turn off color coding
            appenders:
            [ 
                { type: "console", layout: { type: "basic" } } 
            ],
            replaceConsole: true,
            levels: 
            {
                '[all]': 'INFO'
            }
        },
    }

    conf.defaults(defaults);

    logger.debug("Config:", conf.get());

    return conf;
}
