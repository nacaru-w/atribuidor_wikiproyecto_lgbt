interface Window {
    IS_ATRIBUIDOR_LOADED?: boolean;
}

if (!window.IS_ATRIBUIDOR_LOADED) {
    window.IS_ATRIBUIDOR_LOADED = true;
    console.log("Atribuidor cargado 🏳️‍🌈")

} else {
    console.warn("El Atribuidor LGBT se ha intentado cargar más de una vez. Por favor, soluciona la doble importación o contacta con el usuario @Nacaru para informar de esto.")
}