import { ref, get } from "firebase/database";
import { db } from "./firebase";

const dbSearch = async (
    url,
    keyToFilter,
    keyValue,
    nOfMatches,
    returnKey = null
) => {
    const dbRef = ref(db, url);
    const data = await get(dbRef).then(
        (image) => {
            if (image.exists()) {
                var matches = [];
                image.forEach((obj) => {
                    var keys = obj.val();
                    if (keys[keyToFilter] === keyValue) {
                        if (matches.length < nOfMatches) {
                            matches.push(returnKey ? keys[returnKey] : keys)
                        }
                    }
                });
                return matches.length === 0
                    ? null
                    : matches.length === 1
                    ? matches[0]
                    : matches;
            } else {
                console.log("No data available");
            }
        },
        (error) => {
            console.alert(error);
        }
    );
    return data;
};

export default dbSearch;