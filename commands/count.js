const jsonfile = require("jsonfile");

module.exports = {
    name: "count",
    description: "Start count at a specified number.",
    aliases: ["startat"],
    execute(message, args) {
        const count = args[0];
    },
};