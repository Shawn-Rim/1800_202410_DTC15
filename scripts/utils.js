/**
 * Prevents a function from being called too frequently
 * 
 * @param {number} delay the amount of time to wait after the last call in milliseconds
 * @param {funciton} callback the function to call after the delay
 * @returns {funciton} a debounced version of the callback
 */
function debounce(delay, callback) {
  let timeout_id, last_execution = 0;

  function wrapper() {
    const that = this, elapsed = +new Date() - last_execution, args = arguments;

    const exec = () => {
      last_execution = +new Date();
      callback.apply(that, args);
    };

    const clear = () => timeout_id = undefined;

    if (!timeout_id) exec();
    else clearTimeout(timeout_id);

    timeout_id = setTimeout(exec, delay);
  }

  return wrapper;
}
