// This is the PkgCloud driver. 
//
var logger = require('log4js').getLogger("pkgcloud-driver");

var path = require('path');

var pkgcloud = require('pkgcloud');

module.exports = function(params)
{
    logger.debug("Using PkgCloud module store, provider:", params.provider);

    var client = pkgcloud.storage.createClient(params);
    var basePath = params.basePath;

    var driver = 
    {
        provider: params.provider,
        getBlobText: function(blobName, callback)
        {
            var options = {
                container: basePath,
                remote: blobName
            };

            // Ideally we would just handle errors on the stream and not use the callback form of client.download().  Unfortunately,
            // pkgcloud only returns transport-specific logical errors via the callback.  For example, at the Request level, Azure
            // actually returns an XML payload explaining that the contents doesn't exist, and the pkgcloud driver converts that to
            // an error and provides it to the callback (but it does not send that to the "error" event on the stream).
            //
            var content = null;
            var stream = client.download(options, function(err, res)
            {
                if (err)
                {
                    if (err.statusCode == 404)
                    {
                        // Return null if file doesn't exist
                        callback(null, null);
                    }
                    else
                    {
                        callback(err);
                    }
                }
                else
                {
                    callback(null, content);
                }
            });

            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('end', () => {
                content = chunks.join('');
            });
        }
    }

    return driver;
}
