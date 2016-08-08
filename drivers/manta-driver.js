// This is the Manta driver
//
// https://apidocs.joyent.com/manta/
// https://apidocs.joyent.com/manta/nodesdk.html
// https://github.com/joyent/node-manta
//
var logger = require('log4js').getLogger("manta-driver");

var fs = require('fs');
var path = require('path');

var manta = require('manta');

// Sample config
//
//  params: 
//  {
//    "directory": "~~/stor/",
//    "keyStore": "/Users/bob/.ssh/joyent_id_rsa",
//    "keyId": "8c:09:65:e3:74:54:52:3f:c1:82:3b:5d:cd:09:bc:f4",
//    "url": "https://us-east.manta.joyent.com",
//    "user": "bob@synchro.io"
//  }
//
// Alternatively, you can use "key" instead of "keyStore", and populate it with the key itself (in the same
// form as the contents of an .ssh file)
//
// Or if using env vars (in the normal Manta way, AFAICT):
//
//  Key must be in ~/.ssh and named id_rsa
//  MANTA_KEY_ID="8c:09:65:e3:74:54:52:3f:c1:82:3b:5d:cd:09:bc:f4"
//  MANTA_URL="https://us-east.manta.joyent.com"
//  MANTA_USER="bob@synchro.io"
//
// As above, you can use MANTA_KEY (populated with actual key) instead of, in this case, relying on the default ssh key.
//

module.exports = function(params)
{
    var basePath = params.basePath;

    logger.debug("Using Manta module store, basePath:", basePath);

    // "key" is key if provided, else from keyStore if provided, else from default ssh key.
    //    - Not clear if default ssh key is really ever useful here.
    //    - Should explicit keyStore be prioritized over MANTA_KEY env var?
    //
    var key = params.key || process.env.MANTA_KEY || fs.readFileSync(params.keyStore || (process.env.HOME + '/.ssh/id_rsa'), 'utf8'); 

    var client = manta.createClient({
        sign: manta.privateKeySigner({
            key: key,
            keyId: params.keyId || process.env.MANTA_KEY_ID,
            user: params.user || process.env.MANTA_USER
        }),
        user: params.user || process.env.MANTA_USER,
        url: params.url || process.env.MANTA_URL
    });

    logger.debug('Manta client setup: %s', client.toString());

    var driver = 
    {
        provider: "manta",
        getBlobText: function(filename, callback)
        {
            var filePath = path.posix.join(basePath, filename); 

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
                    stream.setEncoding('utf8');

                    const chunks = [];
                    stream.on('data', (chunk) => {
                        chunks.push(chunk);
                    });
                    stream.on('end', () => {
                        callback(null, chunks.join(''));
                    });
                }
            });
        }
    }

    return driver;
}
