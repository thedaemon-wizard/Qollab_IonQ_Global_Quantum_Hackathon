"""Every project data file, as a literal path.

Qollab only ships a data file to the browser runtime when its path appears as a literal
string in Python source, so all paths live here and nowhere else.
"""

DEFAULTS = "config/defaults.json"
EXPERIMENTS = "data/experiments.json"
RECORDED_RUNS = "data/recorded_runs.json"
ROSENFELD_APRIL = "data/third_party/rosenfeld2017/Bell_2016-04-15_9_pairs.csv"
ROSENFELD_JUNE = "data/third_party/rosenfeld2017/Bell_2016-06-14_16_pairs.csv"
