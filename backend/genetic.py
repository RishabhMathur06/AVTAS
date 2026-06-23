import numpy as np
import random
from neural import NeuralNetwork

def mutate_network(net: NeuralNetwork, rate: float, power: float = 0.2):
    """Applies gaussian-style mutation to weights."""
    mutated = net.clone()
    
    # Vectorized mutation using numpy
    def mutate_array(arr):
        mask = np.random.rand(*arr.shape) < rate
        noise = (np.random.rand(*arr.shape) * 2 - 1) * power
        arr[mask] += noise[mask]
        return arr

    mutated.weights0 = mutate_array(mutated.weights0)
    mutated.biases0 = mutate_array(mutated.biases0)
    mutated.weights1 = mutate_array(mutated.weights1)
    mutated.biases1 = mutate_array(mutated.biases1)
    
    return mutated

def crossover_networks(parent_a: NeuralNetwork, parent_b: NeuralNetwork):
    """Uniform crossover blend of two parent networks."""
    child = parent_a.clone()
    
    def blend_arrays(a, b):
        mask = np.random.rand(*a.shape) > 0.5
        return np.where(mask, a, b)

    child.weights0 = blend_arrays(parent_a.weights0, parent_b.weights0)
    child.biases0 = blend_arrays(parent_a.biases0, parent_b.biases0)
    child.weights1 = blend_arrays(parent_a.weights1, parent_b.weights1)
    child.biases1 = blend_arrays(parent_a.biases1, parent_b.biases1)
    
    return child

class Population:
    def __init__(self, size, input_size, hidden_size, output_size):
        self.size = size
        self.generation = 1
        self.best_fitness = 0
        self.best_brain = None
        self.agents = [NeuralNetwork(input_size, hidden_size, output_size) for _ in range(size)]

    def evolve(self, fitness_scores, selection_ratio=0.1, mutation_rate=0.1, mutation_power=0.2):
        """
        fitness_scores: list of dicts like [{"id": 0, "fitness": 120}, ...]
        Returns a new population of networks.
        """
        # Sort scores descending
        sorted_scores = sorted(fitness_scores, key=lambda x: x["fitness"], reverse=True)
        
        # Track global best
        if sorted_scores[0]["fitness"] > self.best_fitness:
            self.best_fitness = sorted_scores[0]["fitness"]
            best_id = sorted_scores[0]["id"]
            self.best_brain = self.agents[best_id].clone()

        # Elitism selection
        elite_count = max(2, int(self.size * selection_ratio))
        elite_brains = [self.agents[s["id"]] for s in sorted_scores[:elite_count]]

        next_brains = [elite_brains[0].clone()]  # Always keep the champion unchanged
        
        while len(next_brains) < self.size:
            pa = random.choice(elite_brains)
            pb = random.choice(elite_brains)
            child = crossover_networks(pa, pb)
            child = mutate_network(child, mutation_rate, mutation_power)
            next_brains.append(child)

        self.agents = next_brains
        self.generation += 1
        
        return self.generation
