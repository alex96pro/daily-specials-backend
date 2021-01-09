export default function randomPassword() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let newPassword = '';
    let letter = true;
    for(let i = 0; i < 10; i++){
        if(letter){
            newPassword += letters.charAt(Math.floor(Math.random()*52));;
            letter = false;
        }else{
            newPassword += Math.floor(Math.random()*10).toString();
            letter = true;
        }
    }
    return newPassword;
}