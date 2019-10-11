const fs = require("fs");
const jsonfile = require("jsonfile");
const { path } = require("../config.json");

let storage;

const data = {
    counting: true,
    lastNumber: 0,
};

// TODO: Verify a channel is set before allowing the command to be used
module.exports = {
    name: "count",
    description: "Start count at a specified number.",
    aliases: ["startat"],
    execute(message, args) {

        if (fs.existsSync(path)) {
            storage = jsonfile.readFileSync(path, function(err) {
                if (err) {
                    console.log(err);
                }
            });
        } else {
            storage = data;
            jsonfile.writeFileSync(path, storage, function(err) {
                if(err) {
                    console.log(err);
                }
            });
        }

        storage.lastNumber = args[0] || 0;

        // TODO: Attempt to read data from json before writing to it

        jsonfile.writeFileSync(path, storage);
        message.send(storage.lastNumber);
    },
};