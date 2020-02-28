// Unused
// Credit to Throwarray for this piece of code
const numbers = new Map([ // map of emoji name to value
    ["zero", 0],
    ["one", 1],
    ["two", 2],
    ["three", 3],
    ["four", 4],
    ["five", 5],
    ["six", 6],
    ["seven", 7],
    ["eight", 8],
    ["nine", 9],
]);

function emojis(message) {
    const matched = message.matchAll(/\s?:(\w+):/g);
    const chars = [];

    if (!matched) return chars;

    let pos = 0;

    // Verify input format
    for (let { index, input, 0: tested, 1: group1 } of matched) {
        let numb = numbers.get(group1); // lookup the emoji from the map

        // fail on additional chars / spaces
        if (index === pos && numb !== undefined) {
            pos = pos + tested.length;

            chars.push({ value: numb, key: group1 });
        } else {
            return [];
        }
    }

    return chars;
}

// Example // if (msg[0] === ':') {}
const msg = ":one: :three: :seven:";
const emojisArr = emojis(msg);
const result = parseInt(
    emojisArr
        .map(({ key, value }) => value)
        .join(""),
    10
);

console.log("result", result, emojisArr);