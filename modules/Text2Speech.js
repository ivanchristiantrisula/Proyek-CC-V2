const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const path = require("path");

const projectId = 'cloud-computing-yummies'
const keyFilename = '../cloud-computing-yummies-ad13cfb68bd1.json'

const client = new textToSpeech.TextToSpeechClient({ projectId, keyFilename });
// const YourSetting = {
//     "audioConfig": {
//       "audioEncoding": "LINEAR16",
//       "pitch": 0,
//       "speakingRate": 1.00
//     },
//     "input": {
//       "text": "Some text input here"
//     },
//     "voice": {
//       "languageCode": "en-US",
//       "name": "en-US-Wavenet-F"
//     },
//     "outputFileName":"../public/output1.mp3"
// };

async function Text2Speech(YourSetting) {
  const [response] = await client.synthesizeSpeech(YourSetting);
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(path.join(__dirname, '../public/'+YourSetting.outputFileName), response.audioContent, 'binary');
  console.log(`Audio content written to file: ${(YourSetting).outputFileName}`);
 //console.log(YourSetting);
}

//Text2Speech(YourSetting);
module.exports = Text2Speech;