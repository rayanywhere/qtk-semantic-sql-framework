const SmartModel = require('../index');
const {Insert, Select, SelectOne, Count, Update, Delete, Join, Statement, Ops} = SmartModel.Keyword;
const assert = require('assert');
const Mysql = require('mysql');
const childProcess = require('child_process');

SmartModel.setup(`${__dirname}/../example/models`, `${__dirname}/../example/config`);

describe('SmartModel', () => {
    describe('CURD', () => {
        it('should return without error', async () => {
            await initDB();
            await Insert('user').data({name:'ray', id: '1001', gender: 1, isVip: true}).run();
            await Insert('user').data({name:'ray宝宝', id: '1002', gender: 0, isVip: true}).run();
            await Insert('user').data({name:'我是ray', id: '1003', gender: 0, isVip: true}).run();
            await Insert('user').data({name:'你好哇，ray猫猫', id: '1004', gender: 1, isVip: true}).run();

            await Insert('user_statistic').data({id:'1001', name:'ray', loginCount:3, logoutCount:2}).run();
            await Insert('order').data({id:'201712251101', amount:1000, userId:'1001'}).run();

            let user = await SelectOne('user').where(
                Statement('name', Ops.EQ, 'ray')
            ).run();

            assert(user.name === 'ray' && user.id === '1001' && user.gender === 1 && user.isVip === true, `output field is different from input`);

            let count = await Count('user').where(
                Statement('name', Ops.LIKE, 'ray%')
            ).run();
            assert(count === 2, `should count 2 with like 'ray%'`);

            count = await Count('user').where(
                Statement('name', Ops.LIKE, '%ray%')
            ).run();
            assert(count === 4, `should count 4 with like '%ray%'`);

            let userList = await Select('user').where(
                Statement('gender', Ops.EQ, 0)
            ).sort('id', 'desc').run();
            assert(userList[0].id === '1003' && userList[1].id === '1002', 'expect 1003 and 1002');

            let [row] = await Select('user')
                .join(Join('user_statistic', 'left', 'user.id', 'user_statistic.id'))
                .join(Join('order', 'left', 'user_statistic.id', 'order.userId'))
                .where(
                    Statement('user.name', Ops.EQ, 'ray')
                ).range(0, 20).run();
            assert(row.user.id === '1001' && row.user_statistic.id === '1001' && row.order.userId === '1001', 'should got correct data with join userId');

            await Update('user').data({isVip: false}).where(
                Statement('user.name', Ops.EQ, 'ray宝宝')
            ).run();
            user = await SelectOne('user').where(
                Statement('name', Ops.EQ, 'ray宝宝')
            ).run();
            assert(user.isVip === false, 'isVip should be false after update');

            await Delete('user').where(
                Statement('name', Ops.EQ, 'ray')
            ).run();
            user = await SelectOne('user').where(
                Statement('name', Ops.EQ, 'ray')
            ).run();
            assert(user === null, 'user should not not existed after del');
        });
    });

    describe('Tool', () => {
        it('[field] should return without error', async () => {
            //add
            await exec(`${__dirname}/../bin/upgrade/field/index.js -a add -o user -f nickname -t string -l 30 -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);
            await exec(`${__dirname}/../bin/upgrade/field/index.js -a add -o user -f order -t boolean -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);
            await exec(`${__dirname}/../bin/upgrade/field/index.js -a add -o user -f createdTime -t integer -i ordinary -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);

            //remove
            await exec(`${__dirname}/../bin/upgrade/field/index.js -a remove -o user -f createdTime -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);

            //update
            await exec(`${__dirname}/../bin/upgrade/field/index.js -a update -o user -f nickname -t string -l 500 -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);

        }).timeout(5000);

        it('[index] should return without error', async () => {
            //add
            await exec(`${__dirname}/../bin/upgrade/index/index.js -a add -o user -f order -i ordinary -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);

            //remove
            await exec(`${__dirname}/../bin/upgrade/index/index.js -a remove -o user -f order -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);
        }).timeout(5000);
    });
});

async function initDB() {
    let _f = async (config) => {
        const mysql = await Mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
        });

        return await new Promise((resolve, reject) => {
            mysql.query(`DROP DATABASE IF EXISTS ${config.database}`, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    };
    const routerList = require(`${__dirname}/../example/config`);

    await Promise.all(Object.entries(routerList).map(([n, config]) => _f(config)));

    await exec(`${__dirname}/../bin/setup/index.js -m ${__dirname}/../example/models/ -c ${__dirname}/../example/config/`);
}

async function exec(cmd) {
    return new Promise((resolve, reject) => {
        childProcess.exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error, stderr);
                return;
            }
            resolve(stdout, stderr);
        });
    });
}
