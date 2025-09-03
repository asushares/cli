#!/bin/sh
# for CONFIDENCE in 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0
for CONFIDENCE in `seq 0 .1 1`
 do
  echo "Running simulation with confidence level: $CONFIDENCE"
  # Run the simulation with the specified confidence level
  time ts-node src/bin/asushares.ts simulate-consent-cds http://localhost:3000 $CONFIDENCE http://localhost:8080/fhir kobe-king-permit data/fhir/ paper/mean-full-run-$CONFIDENCE -r shares-confidence-mean-only.json
done
