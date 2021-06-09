// A proxy for serving the unsecure feed via SSL

const fs = require('fs');
const MjpegDecoder = require('mjpeg-decoder');

exports.handler = async (event, context) => {
  const fileURL = "http://184.186.52.22:8085/mjpg/video.mjpg"
 
  const decoder = new MjpegDecoder(
    fileURL, { maxFrames: 1 }
    );
  const frame = await decoder.takeSnapshot();
  // fs.writeFileSync('snapshot.jpg', frame);

  return {
    statusCode: 200,
    headers: {
      'Content-type': 'image/mjpeg'
    },
    body: frame.toString('base64'),
    isBase64Encoded: true
  }
}