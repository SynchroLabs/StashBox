# StashBox

StashBox is a configurable http proxy server that is capable of serving content from a wide variety of sources, including
the local file system, environment variables, other http servers, and a large number of storage providers, including: 
Amazon (S3), Azure, Google, HP, Joyent (Manta), OpenStack (including IBM BlueMix), and RackSpace.

StashBox is designed to be used in containerized solutions.  Other containers in a solution can easily get configuration
data, including configuration files and secrets, from a StashBox container, without having to be concerned about the 
details of where StashBox is getting the data.  And the only tooling the client containers need in order to talk to 
StashBox is curl.

For example, assume you have an Nginx container that needs certificates and private key files.  That server could simply
execute a script to get those files at startup, such as:

    curl http://stashbox/ssl/domain.pem -o /etc/ssl/domain.pem
    curl http://stashbox/ssl/domain.key -o /etc/ssl/domain.key

## Configuration

StashBox itself can be configured via a local configuration file or via environment variables.  The StashBox config.json
file contains a series of mount points that define locations where data is served and the provider configuration that
supports access to the underlying data.

### General Configuration

You may specify a number of command line options to StashBox.  For a complete list:

    node app.js -h

The primary command lines params are the port and the config file.  StashBox runs on port 80 by default.  To specify the
port on which StashBox runs:

    node app.js -p 1337

StashBox loads its configuration from a JSON file.  By default, it uses config.json from the app directory.  To specify
an alternate configuration file you may pass it on the command line:

    node app.js -c special_config.json 

The port and config file can also be specified via environment variables:

    STASHBOX__PORT=1337
    STASHBOX__CONFIG=special_config.json

### Configuring mounts

Consider the default configuration that looks like this:

    {
        "mounts": 
        [
            { 
                "mount": "/",
                "provider": "file", 
                "basePath": "stash" 
            }
        ]
    }

That defines a single mount point that uses the "file" provider, and provides files from the "stash" directory.
You may populate the "stash" directory with files, and even build those into a container if you like.

Another popular solution involves serving files from local environment variables.  For example, to serve a key file
from an environment variable call KEY, you would add the following mount:

    {
        "mount": "/ssl/key.pem",
        "provider": "env",
        "var": "KEY"
    }

You may define any number of mounts using any desired providers.

### Complex configuration via environment variables

Any configuraton element that can be defined in config.json can also be configured via environment variables.  Such
environment variables should begin with "STASHBOX" and should use double underscores to separate path components. 
Consider the folling config.json:

    {
        "PORT": 1337,
        "mounts": 
        [
            { 
                "mount": "/",
                "provider": "file", 
                "basePath": "stash" 
            },
            { 
                "mount": "/domain.key",
                "provider": "env", 
                "var": "KEY" 
            }
        ]
    }

That could also be implemented with the following environment varables:

    STASHBOX__PORT=1337
    STASHBOX__mounts__0__mount="/"
    STASHBOX__mounts__0__provider="file"
    STASHBOX__mounts__0__basePath="stash"
    STASHBOX__mounts__1__mount="/env"
    STASHBOX__mounts__1__provider="env"
    STASHBOX__mounts__1__var="KEY"

## Providers:

StashBox provides support for many providers.  See the list below.

### Local files

    "provider": "file"
    "basePath": "path/to/directory/to/serve"

### Environment variables

    "provider": "env",
    "var": "SOMEVAR",
    "encoding": "base64" // optional, if env var contents is base64 encoded and you want to serve decoded contents

### HTTP Proxy

    "provider": "proxy",
    "host": "host-to-proxy-to",
    "basePath": "path/at/host" // optional

### Joyent (Manta)

    "provider": "manta",
    "url": "https://us-east.manta.joyent.com",
    "user": "foo@bar.com",
    "keyId": "e3:09:8c:65:e3:09:8c:65:e3:09:8c:65:e3:09:8c:65:",
    // Provide either keyStore (reference to key file) *OR* key (actual key data)
    "keyStore": "/Users/xxx/.ssh/joyent_id_rsa",
    "key": "-----BEGIN RSA PRIVATE KEY----- (actual key data)",
    "basePath": "~~/stor/path"

All storage providers below use PkgCloud (see https://github.com/pkgcloud/pkgcloud#storage for more details on provider config)

### Amazon (S3)

    "provider": "amazon",
    "keyId": "your-access-key-id", // access key id
    "key": "your-secret-key-id", // secret key
    "region": "us-west-2", // region
    "basePath": "/storage/path"

### Azure

    "provider": "azure",
    "storageAccount": "test-storage-account", // Name of your storage account
    "storageAccessKey": "test-storage-access-key", // Access key for storage account
    "basePath": "/storage/path"

### Google

    "provider": "google",
    "keyFilename": "/path/to/a/keyfile.json", // path to a JSON key file
    "projectId": "eco-channel-658", // project id
    "basePath": "/storage/path"

### HP

    "provider": "hp",
    "username": "your-user-name",
    "apiKey": "your-api-key",
    "region": "region of identity service",
    "authUrl": "https://your-identity-service",
    "basePath": "/storage/path"

### OpenStack

    "provider": "openstack",
    "authUrl": "your identity service url",
    "username": "your-user-name",
    "password": "your-password",
    "basePath": "/storage/path"

### IBM BlueMix (using OpenStack provider)

    "provider": "openstack",
    "keystoneAuthVersion": "v3",
    "authUrl": "your identity service url",
    "tenantId": "your-tennant-id", // Called "ProjectID" in BlueMix console
    "username": "your-user-name",
    "password": "your-password",
    "domainId": "your-domain-id",
    "domainName": "your-domain-name",
    "region": "your-region",
    "basePath": "/storage/path"

### RackSpace

    "provider": "rackspace",
    "username": "your-user-name",
    "apiKey": "your-api-key",
    "region": "IAD", // Regions can be found at http://www.rackspace.com/knowledge_center/article/about-regions
    "useInternal": false, // optional, use to talk to serviceNet from a Rackspace machine
    "basePath": "/storage/path"
