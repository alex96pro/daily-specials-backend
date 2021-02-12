export function convertArrayToString(array) {
    if(array.length > 0){
        array = array.join(',');
    }else{
        array = null;
    }
    return array;
};

export function convertStringToArray(string) {
    let array = [];
    if(string){
        array = string.split(',');
    }
    return array;
};

export function convertTagsToArray(meals) {
    for(let i = 0; i < meals.length; i++){
        if(meals[i].tags){
            meals[i].tags = meals[i].tags.split(',');
        }else{
            meals[i].tags = [];
        }
    }
};
export function removeSecondsFromTime(restaurant) {
    for(let i = 0; i < restaurant["working-hours-from"].length; i++){
        if(restaurant["working-hours-from"][i] !== null){
            restaurant["working-hours-from"][i] = restaurant["working-hours-from"][i].substring(0, restaurant["working-hours-from"][i].length - 3);
            restaurant["working-hours-to"][i] = restaurant["working-hours-to"][i].substring(0, restaurant["working-hours-to"][i].length - 3);
        }
    }
}
export function mergeWorkingHoursArrays(restaurant) {
    let workingHours = [];
    for(let i = 0; i < restaurant["working-hours-from"].length; i++){
        workingHours.push({
            from: restaurant["working-hours-from"][i],
            to: restaurant["working-hours-to"][i]
        });
    }
    return workingHours;
};
export function checkWorkingHours(workingHoursFromParam, workingHoursToParam) {
    let workingHoursFrom = [];
    let workingHoursTo = [];
    for(let i = 0; i < workingHoursFromParam.length; i++) {
        if(!workingHoursFromParam[i] || !workingHoursToParam[i]){ // null or undefined or ''
            workingHoursFrom.push('null');
            workingHoursTo.push('null');
        }else{
            workingHoursFrom.push(workingHoursFromParam[i]);
            workingHoursTo.push(workingHoursToParam[i]);
        }
    }
    return {workingHoursFrom: workingHoursFrom, workingHoursTo: workingHoursTo};
}