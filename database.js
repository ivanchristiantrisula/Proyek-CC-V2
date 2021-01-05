const pg= require('pg');

/**
 * TODO(developer): specify SQL connection details
 */
// const connectionName ='cloud-computing-yummies:us-central1:cc-yummies';
// const dbUser = 'postgres';
// const dbPassword = 'postgres'
// const dbName = 'yummies';

// const pgConfig = {
//   max: 1,
//   user: dbUser,
//   password: dbPassword,
//   database: dbName,
//   host : '35.222.156.8/cloudsql/cloud-computing-yummies:us-central1:cc-yummies'
// };

// if (process.env.NODE_ENV === 'production') {
//   pgConfig.host = `/cloudsql/${connectionName}`;
// }

// Connection pools reuse connections between invocations,
// and handle dropped or expired connections automatically.
//let pgPool;

const connection= {
    //heroku: 'postgres://postgres:jonsubabi@35.222.156.8:5432/yummies',
    heroku: 'postgres://qujtvikdqqxonx:359c1d27094a8117df29f691adec3f9eafd240d32aa4b791045cf8cfcf163030@ec2-3-231-16-122.compute-1.amazonaws.com:5432/d1c041fls51j9l',
    //local: 'postgres://postgres:kusogaki@localhost:5432/Proyek_SOA'
};
const connString= connection.heroku;

let poolParams= {
    connectionString: connString
};

if (connString === connection.heroku) {
    poolParams.ssl= {
        rejectUnauthorized: false 
    };
}

const pool= new pg.Pool(poolParams);

const executeQuery= (query) => {
    try {
        return new Promise((resolve, reject) => {
            pool.query(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
    } catch (error) {
        console.log(error);
    }
};

module.exports= {
    'executeQuery': executeQuery
};
