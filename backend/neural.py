import numpy as np

class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # Initialize weights with Xavier/Glorot-like uniform distribution
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        self.weights0 = np.random.uniform(-1, 1, (input_size, hidden_size))
        self.biases0 = np.random.uniform(-1, 1, hidden_size)
        self.weights1 = np.random.uniform(-1, 1, (hidden_size, output_size))
        self.biases1 = np.random.uniform(-1, 1, output_size)

    def feed_forward(self, inputs):
        """
        Inputs: numpy array of shape (N, input_size) or (input_size,)
        Outputs: numpy array of shape (N, output_size) or (output_size,)
        """
        inputs = np.array(inputs)
        # Hidden layer
        hidden = np.tanh(np.dot(inputs, self.weights0) + self.biases0)
        # Output layer
        outputs = np.tanh(np.dot(hidden, self.weights1) + self.biases1)
        return outputs

    def get_weights(self):
        return {
            "weights0": self.weights0.tolist(),
            "biases0": self.biases0.tolist(),
            "weights1": self.weights1.tolist(),
            "biases1": self.biases1.tolist()
        }

    def set_weights(self, w_dict):
        self.weights0 = np.array(w_dict["weights0"])
        self.biases0 = np.array(w_dict["biases0"])
        self.weights1 = np.array(w_dict["weights1"])
        self.biases1 = np.array(w_dict["biases1"])

    def clone(self):
        new_net = NeuralNetwork(self.input_size, self.hidden_size, self.output_size)
        new_net.set_weights(self.get_weights())
        return new_net
