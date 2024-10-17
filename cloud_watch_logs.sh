#!/bin/bash

# Set the log group name and date range
LOG_GROUP_NAME="/aws/lambda/partnerize-checkout-event-middleware"
START_TIME=$(date -j -f "%Y-%m-%d %H:%M:%S" "2024-09-05 00:00:00" "+%s")000
END_TIME=$(date -j -f "%Y-%m-%d %H:%M:%S" "2024-09-17 23:59:59" "+%s")000
FILTER_PATTERN="[\"event\", \"customerType\"]"

# Initialize variables
count=0
next_token=""
file_index=0

# Create output directory
OUTPUT_DIR="./cloudwatch_logs"
mkdir -p "$OUTPUT_DIR"

# Function to handle cleanup on exit
cleanup() {
    echo -e "\nScript interrupted. Exiting..."
    exit 0
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Loop to fetch logs until no more tokens
while true; do
    # Build the command
    cmd="aws logs filter-log-events \
        --log-group-name \"$LOG_GROUP_NAME\" \
        --start-time \"$START_TIME\" \
        --end-time \"$END_TIME\" \
        --filter-pattern \"$FILTER_PATTERN\" \
        --limit 10000"

    # Add next_token if it's not empty
    if [ -n "$next_token" ]; then
        cmd+=" --next-token \"$next_token\""
    fi
    echo $cmd
    # Execute the command and capture the response
    response=$(eval "$cmd")

    # Count the number of events in the response
    event_count=$(echo "$response" | jq '.events | length')
    
    # If no events, exit the loop
    if [ "$event_count" -eq 0 ]; then
        echo "No more events found."
        break
    fi

    # Save events to a new log file
    output_file="$OUTPUT_DIR/log_events_${file_index}.json"
    echo "$response" | jq '.events' > "$output_file"
    echo "Saved $event_count events to $output_file"

    # Increment the file index for the next output file
    file_index=$((file_index + 1))
    
    # Update next_token for pagination
    next_token=$(echo "$response" | jq -r '.nextToken')
    
    # Check if there's a next token; if not, break
    if [[ "$next_token" == "null" ]]; then
        echo "All events have been fetched."
        break
    fi
done

echo "Total log events fetched: $count"