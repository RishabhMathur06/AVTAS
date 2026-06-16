/**
 * neural.js
 * All neural network and genetic algorithm logic for AVTAS.
 * Completely decoupled from React — pure functions.
 */

/** Deep-clone a neural network weight structure */
export const cloneNetwork = (net) => ({
  weights0: net.weights0.map(row => [...row]),
  biases0:  [...net.biases0],
  weights1: net.weights1.map(row => [...row]),
  biases1:  [...net.biases1],
});

/** Create a randomly initialised network: inputSize→hiddenSize→outputSize */
export const generateRandomNetwork = (inputSize, hiddenSize, outputSize) => {
  const weights0 = Array.from({ length: inputSize  }, () =>
    Array.from({ length: hiddenSize  }, () => Math.random() * 2 - 1)
  );
  const biases0  = Array.from({ length: hiddenSize  }, () => Math.random() * 2 - 1);
  const weights1 = Array.from({ length: hiddenSize  }, () =>
    Array.from({ length: outputSize  }, () => Math.random() * 2 - 1)
  );
  const biases1  = Array.from({ length: outputSize  }, () => Math.random() * 2 - 1);

  return { weights0, biases0, weights1, biases1 };
};

/** Apply gaussian-style mutation to every weight at the given rate/power */
export const mutateNetwork = (net, rate, power = 0.2) => {
  const mut = (v) => Math.random() < rate ? v + (Math.random() * 2 - 1) * power : v;
  return {
    weights0: net.weights0.map(row => row.map(mut)),
    biases0:  net.biases0.map(mut),
    weights1: net.weights1.map(row => row.map(mut)),
    biases1:  net.biases1.map(mut),
  };
};

/** Uniform crossover blend of two parent networks */
export const crossoverNetworks = (parentA, parentB) => {
  const blend = (a, b) => Math.random() > 0.5 ? a : b;
  return {
    weights0: parentA.weights0.map((row, i) => row.map((v, j) => blend(v, parentB.weights0[i][j]))),
    biases0:  parentA.biases0.map((v, i) => blend(v, parentB.biases0[i])),
    weights1: parentA.weights1.map((row, i) => row.map((v, j) => blend(v, parentB.weights1[i][j]))),
    biases1:  parentA.biases1.map((v, i) => blend(v, parentB.biases1[i])),
  };
};

/**
 * Feedforward pass.
 * Inputs: [5 LIDAR sensors, normalised speed]
 * Outputs: [steer, throttle] both in tanh range
 */
export const feedForward = (inputs, net) => {
  const hidden = net.biases0.map((bias, i) => {
    let sum = bias;
    inputs.forEach((inp, j) => { sum += inp * net.weights0[j][i]; });
    return Math.tanh(sum);
  });

  const outputs = net.biases1.map((bias, i) => {
    let sum = bias;
    hidden.forEach((h, j) => { sum += h * net.weights1[j][i]; });
    return Math.tanh(sum);
  });

  return { hidden, outputs };
};
