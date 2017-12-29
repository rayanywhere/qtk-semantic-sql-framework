const SmartModel = require('../');
const {Insert, Select, SelectOne, Count, Update, Delete, Join, Statement, Ops} = SmartModel.Keyword;
const assert = require('assert');
const Mysql = require('mysql');

SmartModel.setup(`${__dirname}/models`, `${__dirname}/config`);

describe('SmartModel', () => {
    describe('CURD', () => {
        it('should return without error', async () => {
            await truncate();
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

            await truncate();
        });
    });

    describe('Tool', () => {
        it('');
    });
});

async function truncate() {
    let _f = async (model) => {
        const routerList = require(`${__dirname}/config`);
        const router = require(`${__dirname}/models/${model}`).router;

        const mysql = await Mysql.createConnection(routerList[router]);
        let sql = Mysql.format('truncate table ??.??', [routerList[router].database, model]);
        return await new Promise((resolve, reject) => {
            mysql.query(sql, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    };
    await Promise.all([
        _f('order'),
        _f('user'),
        _f('user_statistic')
    ]);
}
