//
// Provider: "env" (environment variable)
//
// Allows for mapping a mount path to a single environment variable by specifying the "mount" and "var"
// elements.  To set an environment variable to the contents of a file from the command line:
//
//     export KEY="$(cat keyfile.pem)"
//
// If the environment variable is populated with base64 encoded contents and the goal is to transfer the 
// decoded contents, you can additionally specify "encoding" as "base64".  To set an environment variable
// to the base64 encoded contents of a file from the command line:
//
//     export KEY64="$(cat keyfile.pem | base64)"
//
// Example configs:
//
// {
//   "mount": "/secret/key.pem",
//   "provider": "env",
//   "var": "KEY"
// }
//
// {
//   "mount": "/secret/key64.pem",
//   "provider": "env",
//   "var": "KEY64",
//   "encoding": "base64"
// }
//
var logger = require('log4js').getLogger("env-driver");

module.exports = function(params)
{
    logger.debug("Using env driver");

    if (!params.var)
    {
        throw Error("A 'var' must be provided to the env provider");
    }

    var driver = 
    {
        provider: "env",
        getObject: function(filename, callback)
        {
            var envValue = null;
            if (filename === "/")
            {
                if (process.env[params.var])
                {
                    envValue = process.env[params.var];
                    if (params.encoding === 'base64')
                    {
                        envValue = new Buffer(envValue, 'base64');
                    }
                    logger.debug("Returning value for env var: %s", params.var);
                }
                else
                {
                    // No env var with the specified value - 404 (return null)
                    //
                    logger.debug("No value for env var: %s", params.var);
                }
            }
            else
            {
                // Env mount points should fully specify the mount path.  If we get any "extra"
                // path here, in the form of filename (such as appending a slash and additional
                // path elements), then we consider this a miss/404.
                //
                logger.debug("Extra path elements for env var mounted at: %s", params.mount);
            }

            callback(null, envValue);
        }
    }

    return driver;
}
