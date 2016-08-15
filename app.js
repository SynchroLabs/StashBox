var express = require('express');
var path = require('path');
var url = require('url');
var log4js = require('log4js');

var stashBoxConfig = require('./lib/config');
var pkg = require('./package.json');

var proxy = require('express-http-proxy');

var envDriver = require('./drivers/env-driver');
var mantaDriver = require('./drivers/manta-driver');
var pgkcloudDriver = require('./drivers/pkgcloud-driver');

// Process command line params
//
var commander = require('commander');
commander.version(pkg.version);
commander.option('-p, --port <n>', 'The port on which the StashBox server will listen', parseInt);
commander.option('-c, --config <value>', 'Use the specified configuration file');
commander.parse(process.argv);

var overrides = {};

if (commander.port)
{
    overrides.PORT = commander.port;
}

var config = stashBoxConfig.getConfig(commander.config, overrides);

log4js.configure(config.get('LOG4JS_CONFIG'));

var logger = log4js.getLogger("app");
logger.info("StashBox server loading - " + config.configDetails);

var app = express();

function getDriverMiddleware(driver)
{
    return function(req, res)
    {
        logger.info("Getting %s using %s", req.originalUrl, driver.provider);

        driver.getBlobText(req.url, function(err, contents)
        {
            if (err)
            {
                // We don't want to leak any information about this mountPoint, so we log the error
                // locally and just return "Error" to the caller.
                //
                logger.error("Error in request for: %s, details: %s", req.url, JSON.stringify(err));
                res.status(500).send('Error');
            }
            else if (contents === null)
            {
                // null response from driver means not found...
                //
                res.status(404).send('Not found');
            }
            else
            {
                res.send(contents);
            }
        });
    }
}

function addMountPoint(mount)
{
    logger.debug("Mount point: %s, mount: %s", mount.mount, JSON.stringify(mount));

    if (mount.provider === "file")
    {
        logger.info("Adding file mount for:", mount.mount);
        var mountPath = mount.basePath;
        if (!path.isAbsolute(mountPath))
        {
            mountPath = path.join(__dirname, mount.basePath)
        }
        app.use(mount.mount, express.static(mountPath));
    }
    else if (mount.provider === "proxy")
    {
        logger.info("Adding proxy mount for:", mount.mount);
        app.use(mount.mount, proxy(mount.host, 
        {
            forwardPath: function(req, res) 
            {
                var path = url.parse(req.url).path; 
                logger.info("Processing proxy request for:", path);
                return mount.basePath + path;
            }
        }));
    }
    else
    {
        var driver;
        if (mount.provider === "env")
        {
            logger.info("Adding env mount for:", mount.mount);
            driver = new envDriver(mount);
        }
        else if (mount.provider === "manta")
        {
            logger.info("Adding manta mount for:", mount.mount);
            driver = new mantaDriver(mount);
        }
        else
        {
            logger.info("Adding pkgcloud mount for:", mount.mount);
            driver = new pgkcloudDriver(mount);
        }

        app.use(mount.mount, getDriverMiddleware(driver));
    }
}

// We are going to apply the mounts in the order they are defined - the first qualifying mount point will be
// applied, so more specific mount points should be defined before less specific ones.
//
// The default behavior is a file mount point on "/" pointing to "stash".
//
var mounts = config.get('mounts');
for (var i = 0; i < mounts.length; i++)
{
    if (mounts[i])
    {
        addMountPoint(mounts[i]);
    }
}

// This is our catch-all to handle requests that didn't match any mount point.  We do this so we can control
// the 404 response (and maybe log if desired).
//
app.all('*', function(req, res)
{
    res.status(404).send('Not found');
});

app.listen(config.get('PORT'), function () 
{
    logger.info('StashBox listening on port:', this.address().port);
});

process.on('SIGTERM', function ()
{
    logger.info('SIGTERM - preparing to exit.');
    process.exit();
});

process.on('SIGINT', function ()
{
    logger.info('SIGINT - preparing to exit.');
    process.exit();
});

process.on('exit', function (code)
{
    logger.info('Process exiting with code:', code);
});
