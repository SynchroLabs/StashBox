// This is the environment var driver
//
var logger = require('log4js').getLogger("env-driver");


module.exports = function(params)
{
    logger.debug("Using env driver");

    // We require a list of published env vars (so we don't expose the entire env of the machine)
    //
    if (!params.vars)
    {
        throw Error("A specific list of env 'vars' must be provided to the env provider");
    }

    // The 'vars' spec may be a comma or space separated string (particularly when it is itself specified via an env var 
    // to StashBox).  If we encounter this form, we will convert to an array of strings (the native/canonical form).
    //
    if (typeof params.vars === 'string' || params.vars instanceof String)
    {
        params.vars = params.vars.split(/[, ]/);
    }

    logger.debug("Published env vars:", params.vars);

    var driver = 
    {
        provider: "env",
        getBlobText: function(filename, callback)
        {
            var envVar = filename.substring(1);

            if (params.vars.indexOf(envVar) >= 0)
            {
                var envValue = process.env[envVar];
                logger.info("envValue of: %s = %s", envVar, envValue);
                if (envValue === undefined)
                {
                    envValue = null;
                }
                callback(null, envValue);
            }
            else
            {
                logger.info("Env provider got request for var '%s' not specified in 'vars' list, returning 404", envVar);
                callback(null, null);
            }
        }
    }

    return driver;
}
