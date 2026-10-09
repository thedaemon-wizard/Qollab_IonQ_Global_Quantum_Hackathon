# Munich event-ready Bell test data (Rosenfeld et al. 2017)

The two files in this folder are copied without modification from the Zenodo record
**doi:10.5281/zenodo.22936124** (published 2026-09-24), licensed under
**Creative Commons Attribution 4.0 International (CC BY 4.0)**,
https://creativecommons.org/licenses/by/4.0/.

| File | From archive | SHA-256 |
|---|---|---|
| `Bell_2016-04-15_9_pairs.csv` | `Bell_2016-04-15.zip` (md5 53544819317d4dcfbe5c63e039a8aa38) | 1351c0a73ee84dccbb74f2a7086d72350d4e4690fcb3c32adc04ee547603845f |
| `Bell_2016-06-14_16_pairs.csv` | `Bell_2016-06-14.zip` (md5 030ce1a0c6c6cc7f1107e1cd608cce77) | be7b68b47444b1488a1aa2efe61769a3b2c0effd72709ed776741d4e56894b71 |

Only the `*_pairs.csv` files (valid atom-atom events) are included. The `*_lab_1.csv`,
`*_lab_2.csv` files, the archive readme and the website material are not.

Please cite both the data record and the paper:

- W. Rosenfeld, D. Burchardt, R. Garthoff, K. Redeker, N. Ortegel, M. Rau and
  H. Weinfurter, "Event-Ready Bell Test Using Entangled Atoms Simultaneously Closing
  Detection and Locality Loopholes", *Phys. Rev. Lett.* **119**, 010402 (2017),
  https://doi.org/10.1103/PhysRevLett.119.010402
- Zenodo record https://doi.org/10.5281/zenodo.22936124

How this project reads the files (our interpretation, checked against Tables S8 and S10 of
the paper's Supplemental Material count for count): tab-separated; `setting lab 1` 0/1 =
0°/90°, `setting lab 2` 0/1 = −45°/+45°, `result` 1 = +1 and 0 = −1. The paper uses
5,000 events for each heralded state (`Psi-`, `Psi+`); taking the first 5,000 in file order
is our reading, and it reproduces the paper's tables count for count. The
15 April 2016 run reproduces the paper's S = 2.221 ± 0.033; the public 14 June 2016 run
gives S = 2.096 ± 0.034.
