// 
// Provider: "s3compatible"
//
// This driver uses Minio lib https://github.com/minio/minio-js
//
// Example config:
//
//
// {
//   "mount": "/foo/bar",
//   "provider": "s3compatible",
//   "bucket": "configs",
//   "endpoint": "obs.na-mexico-1.telefonicaopencloud.com",
//   "accessKey": "44XVDUHUOTHPRPS8GJEQ",
//	 "secretKey": 'ajarenareXGvuCbqpnipON4hkNkR1GapuExAPu",
//   "region": "eu-west-2" (AWS S3 region equivalent)
// }
//
//
var logger = require('log4js').getLogger("s3compatible-driver");

var fs = require('fs');
var path = require('path');

var s3compatible = require('minio');

module.exports = function(params)
{
    var s3endpoint = params.endpoint;
    var s3bucket = params.bucket;
    var s3accessKey = params.accessKey;
    var s3secretKey = params.secretKey;
    var s3region = params.region;
    
    logger.debug("Using S3 Compatible service, location:", s3endpoint+"/"+s3bucket);

    
    var s3compatibleClient = new s3compatible.Client({
    	endPoint: s3endpoint,
    	accessKey: s3accessKey,
    	secretKey: s3secretKey,
    	region: s3region,
    	// Debug
    	//secure: false
	});

    logger.debug('S3 Compatible client setup: %s', s3compatibleClient.toString());
    
	var driver =
	{
		provider: "s3compatible",
        getObject: function(filename, callback)
        {

	 		var size = 0
	 		
            // path.basename will maintain the name of the file only.
            //
            var newfilename = path.basename(filename);
            	 		
			s3compatibleClient.getObject(s3bucket, newfilename, function(err,dataStream) {
  			if (err) {
    			return console.log(err)
  			}
  			
  			const chunks = [];

            dataStream.on('data', function(chunk) {
 	        	chunks.push(chunk);
    			size += chunk.length;       	
            });
            dataStream.on('end', function() {
	   			console.log('End. Total size = ' + size)
    		    callback(null, Buffer.concat(chunks));
            });
  			dataStream.on('error', function(err) {
    			console.log(err)
    		})
  			
  			console.log('S3 compatible download success');
			});
        	
        }   
		
	}
    return driver;

}
