// const config= {
//     host: 'https://api.spoonacular.com/recipes',
//     api_key: 'f98cdbd8f5084a02894f0ef781e29a61',
//     api_key_hubert: '4f8bb17c915842d0b2c28b02853c8a78'
// };



module.exports.APIInfo = async () => {
    const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
    const name = 'projects/cloud-computing-yummies/secrets/spoonaculars/versions/latest';

    const secretManagerServiceClient = new SecretManagerServiceClient();
    const [version] = await secretManagerServiceClient.accessSecretVersion({ name });
    const payload = version.payload.data.toString();
    console.debug(`Payload: ${payload}`);
    return {
        host: 'https://api.spoonacular.com/recipes',
        api_key: payload,
        api_key_hubert: '4f8bb17c915842d0b2c28b02853c8a78'
    };
};