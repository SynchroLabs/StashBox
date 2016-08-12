// 
// Provider: "manta" (Joyent Manta storage)
//
// https://apidocs.joyent.com/manta/
// https://apidocs.joyent.com/manta/nodesdk.html
// https://github.com/joyent/node-manta
//
// Example config:
//
// Using a keystore file (ssh key file):
//
// {
//   "mount": "/foo/bar",
//   "provider": "manta",
//   "basePath": "~~/stor/",
//   "url": "https://us-east.manta.joyent.com",
//   "user": "user@domain.com"
//   "keyId": "8c:09:65:e3:8c:09:65:e3:8c:09:65:e3:8c:09:65:e3",
//   "keyStore": "/Users/you/.ssh/joyent_id_rsa"
// }
//
// Specifying the key explicitly in config (using contents of ssh key file):
//
// {
//   "mount": "/foo/bar",
//   "provider": "manta",
//   "basePath": "~~/stor/",
//   "url": "https://us-east.manta.joyent.com",
//   "user": "user@domain.com"
//   "keyId": "8c:09:65:e3:8c:09:65:e3:8c:09:65:e3:8c:09:65:e3",
//   "key": "-----BEGIN RSA PRIVATE KEY-----\nLOTS-OF-KEY-DATA-HERE==\n-----END RSA PRIVATE KEY-----"
// }
//
var logger = require('log4js').getLogger("manta-driver");

var fs = require('fs');
var path = require('path');

var manta = require('manta');

module.exports = function(params)
{
    var basePath = params.basePath;

    logger.debug("Using Manta module store, basePath:", basePath);

    // key is "key" if provided, else from "keyStore" file.
    //
    var key = params.key || fs.readFileSync(params.keyStore, 'utf8'); 

    var client = manta.createClient({
        sign: manta.privateKeySigner({
            key: key,
            keyId: params.keyId,
            user: params.user
        }),
        user: params.user,
        url: params.url
    });

    logger.debug('Manta client setup: %s', client.toString());

    var driver = 
    {
        provider: "manta",
        getBlobText: function(filename, callback)
        {
            // path.posix.normalize will move any ../ to the front, and the regex will remove them.
            //
            var safeFilenamePath = path.posix.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
            var filePath = path.posix.join(basePath, safeFilenamePath); 

            client.get(filePath, function(err, stream) 
            {
                if (err)
                {
                    if (err.code == 'ResourceNotFound')
                    {
                        // Return null - file doesn't exist
                        callback(null, null);
                    }
                    else
                    {
                        logger.error(err);
                        callback(err);
                    }
                }

                if (stream)
                {
                    const chunks = [];
                    stream.on('data', (chunk) => {
                        chunks.push(chunk);
                    });
                    stream.on('end', () => {
                        callback(null, Buffer.concat(chunks));
                    });
                }
            });
        }
    }

    return driver;
}
