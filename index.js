var mysql  = require('mysql');
var args   = require('optimist').argv;
var config = require(args.config || '../../config.js');

var create_ip_banlist = "CREATE TABLE IF NOT EXISTS `ip_banlist` (";
    create_ip_banlist+= "  `id` int(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(id),";
    create_ip_banlist+= "  `ip` varchar(40) NOT NULL,";
    create_ip_banlist+= "  `blocked` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,";
    create_ip_banlist+= "  `note` text NOT NULL";
    create_ip_banlist+= ")";

function Plugin() {
    console.log("Loading janus-mysql-ipban");
    log.info("Loading janus-mysql-ipban");
    this._conn = mysql.createPool({
    host     : config.MySQL_Hostname,
    user     : config.MySQL_Username,
    password : config.MySQL_Password,
    database : config.MySQL_Database
    });

    this._conn.query(create_ip_banlist, function(err, results) {
        if(err != null) throw new Error(err);
        if(results.warningCount == 0) log.info("Created `ip_banlist` table.");
    });

    console.log("Connected to mysql server "+config.MySQL_Hostname);
    log.info("Connected to mysql server "+config.MySQL_Hostname);
}

Plugin.prototype.call = function(name, session, command) {
    var ban_query = "SELECT * FROM `ip_banlist` WHERE `ip` = ?";
    var where = [session._socket.remoteAddress];
    var sql = mysql.format(ban_query, where);

    this._conn.query(sql, function(err, results) {
        if(err != null) throw new Error(err);
        if(results.length) {
            for(k in results) {
                session.clientError('You were blocked on ' + results[k].blocked);
                session._socket.destroy();
                return;
            }
        }
    });
}

module.exports = new Plugin();
