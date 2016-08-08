# StashBox

Purpose and usage (via curl)

## Configuration

## Providers:

### Local files

    "provider": "file"
    "basePath": "path/to/directory/to/serve"

### Environment variables

    "provider": "env",
    "vars": ["list", "of", "vars", "to", "expose"]

### HTTP Proxy

    "provider": "proxy",
    "host": "host-to-proxy-to",
    "basePath": "path/at/host" // optional

### Joyent (Manta)

    "provider": "manta",
    // Provide either keyStore (reference to key file) *OR* key (actual key data)
    "keyStore": "/Users/xxx/.ssh/joyent_id_rsa",
    "key": "-----BEGIN RSA PRIVATE KEY----- (actual key data)",
    "keyId": "e3:09:8c:65:e3:09:8c:65:e3:09:8c:65:e3:09:8c:65:",
    "url": "https://us-east.manta.joyent.com",
    "user": "foo@bar.com",
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
    "username": "your-user-name",
    "password": "your-password",
    "tenantId": "your-tennant-id",
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
