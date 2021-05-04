const { Listener } = require('discord-akairo');

class CallsEndListener extends Listener {
    constructor() {
        super('calls-end', {
            emitter: 'client',
            event: 'calls-end'
        });
    };

    async exec(id) {
        try {
        
            const call = (await this.client.db.query(`SELECT * FROM calls WHERE call_id = ${id}`)).rows[0];
            
            await (await this.client.channels.fetch(call.voice_channel_id)).delete();
            await (await this.client.channels.fetch(call.text_channel_id)).delete();

            await this.client.db.query(`DELETE FROM calls WHERE call_id = ${call.call_id}`)
    
        } catch (e) {
            console.log(e)
        };
    };
};

module.exports = CallsEndListener;