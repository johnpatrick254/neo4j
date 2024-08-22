#!/bin/bash



# Configuration
output_file="export/repo_code.txt"
include_patterns=(
"export/steps.txt"
"vite.config.js"
".replit"
"package.json"
"src/*"
"./*"
)
exclude_patterns=(
    "*/node_modules/*",
    "*/.*",
    "*/client/dist/*",
    "./client/package-lock.json",
    "./src/*.ico",
    "./src/*.png",
    "./src/*.svg",
    "./src/*.jpg",
    "./src/*.jpeg",
    "./src/*.gif",
    "./public*",
    "*.ico",
    "*.png",
    "*.svg",
    "*.jpg",
    "*.jpeg",
    "*.gif"
)



# Function to check if a file should be excluded
should_exclude() {
local file="$1"
for pattern in "${exclude_patterns[@]}"; do
if [[ "$file" == $pattern ]]; then
return 0
fi
done
return 1
}



# Initialize the output file
{
echo "--- BEGIN REPOSITORY CONTENTS ---"
echo
echo "Generative AI Web App Code Repository"
echo
echo "--- BEGIN DIRECTORY OVERVIEW ---"



# List files
for pattern in "${include_patterns[@]}"; do
# Locate files
while IFS= read -r -d '' file; do
if ! should_exclude "$file"; then
echo "$file"
fi
done < <(find . -path "./$pattern" -type f -print0)
done



echo "--- END DIRECTORY OVERVIEW ---"
echo
echo "--- BEGIN FILE CONTENTS ---"
echo



# Process each file
for pattern in "${include_patterns[@]}"; do
# Locate files
while IFS= read -r -d '' file; do
if ! should_exclude "$file"; then
echo "--- FILE: $file ---"
echo
echo "<<< BEGIN $file >>>"
cat "$file"
echo
echo "<<< END $file >>>"
echo
fi
done < <(find . -path "./$pattern" -type f -print0)
done



echo "--- END FILE CONTENTS ---"
echo
echo "--- END REPOSITORY CONTENTS ---"
} > "$output_file"



# Check if the file was created successfully
if [ -f "$output_file" ]; then
echo "Successfully created $output_file"
else
echo "Failed to create $output_file"
fi