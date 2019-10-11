const jsonfile = require("jsonfile");
// TODO: Verify a channel is set before allowing the command to be used
module.exports = {
    name: "count",
    description: "Start count at a specified number.",
    aliases: ["startat"],
    execute(message, args) {
        const count = args[0];

        // TODO: Attempt to read data from json before writing to it
        
        const data = {
            counting: true,
            lastNumber: count,
        };

        jsonfile.writeFileSync("./data/data.json", data);
        message.send(countStart);
    },
};