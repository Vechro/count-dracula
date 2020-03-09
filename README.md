# Count Dracula the Discord counting bot

## Setup

* Clone the repo and navigate to the folder
* Run `npm i` to install the dependencies
* Create a `.env` in the root folder of the repo with your own values
    ```
    PREFIX="<prefix that is required in front of commands, e.g. '!'>"
    TOKEN="<your bot token from discord>"
    DATA_PATH="</path/to/storage>.json"
    ```
* Run `npm start`

### Rules

1. The number has to be the first thing in your message. If you choose to you can add more text after the number as long as it's separated by a space from the number.
2. The number has to be written in text in the base-10, binary (prefixed by "0b") or hexadecimal (prefixed by "0x") format. Both Arabic and Roman numerals are valid.
3. Only one consecutive number per person.
4. No editing/deleting. You may only edit your message if you do not change the number at the start of the message.

### Consequences

Messing up will temporarily remove your right to count by modifying your permission to write in #counting