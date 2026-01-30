#!/bin/bash

#═══════════════════════════════════════════════════════════════════
# PDFCraft - Ralph Autonomous Development Orchestrator
#═══════════════════════════════════════════════════════════════════
#
# This script runs Claude Code in an autonomous loop, implementing
# user stories one at a time until all are complete.
#
# Usage:
#   ./ralph.sh              # Run with default 40 iterations
#   ./ralph.sh 20           # Run with 20 iterations max
#   ./ralph.sh --status     # Show current story status
#   ./ralph.sh --reset      # Reset all stories to incomplete
#
#═══════════════════════════════════════════════════════════════════

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
MAX_ITERATIONS=${1:-40}
PRD_FILE="prd.json"
PROGRESS_FILE="progress.txt"
AGENTS_FILE="agents.md"
PROMPT_FILE="claude-iteration-prompt.md"

#───────────────────────────────────────────────────────────────────
# Helper Functions
#───────────────────────────────────────────────────────────────────

print_header() {
    echo -e "${PURPLE}"
    echo "═══════════════════════════════════════════════════════════════════"
    echo "  🚀 PDFCraft Ralph Builder"
    echo "═══════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_status() {
    echo -e "${BLUE}📊 Current Story Status:${NC}"
    echo ""
    
    # Count stories
    TOTAL=$(jq '.stories | length' $PRD_FILE)
    COMPLETE=$(jq '[.stories[] | select(.passes == true)] | length' $PRD_FILE)
    REMAINING=$((TOTAL - COMPLETE))
    
    echo -e "  Total Stories:    ${TOTAL}"
    echo -e "  ${GREEN}✅ Complete:${NC}       ${COMPLETE}"
    echo -e "  ${YELLOW}⏳ Remaining:${NC}      ${REMAINING}"
    echo ""
    
    # Show next story
    NEXT_STORY=$(jq -r '.stories[] | select(.passes == false) | "\(.id): \(.title)"' $PRD_FILE | head -1)
    if [ -n "$NEXT_STORY" ]; then
        echo -e "  ${BLUE}📍 Next Story:${NC} $NEXT_STORY"
    else
        echo -e "  ${GREEN}🎉 All stories complete!${NC}"
    fi
    echo ""
}

show_all_stories() {
    echo -e "${BLUE}📋 All Stories:${NC}"
    echo ""
    jq -r '.stories[] | "  \(if .passes then "✅" else "⬜" end) \(.id): \(.title)"' $PRD_FILE
    echo ""
}

reset_stories() {
    echo -e "${YELLOW}⚠️  Resetting all stories to incomplete...${NC}"
    jq '.stories |= map(.passes = false)' $PRD_FILE > tmp.json && mv tmp.json $PRD_FILE
    echo -e "${GREEN}✅ All stories reset${NC}"
}

check_requirements() {
    # Check for required files
    if [ ! -f "$PRD_FILE" ]; then
        echo -e "${RED}❌ Error: $PRD_FILE not found${NC}"
        exit 1
    fi
    
    if [ ! -f "$PROMPT_FILE" ]; then
        echo -e "${RED}❌ Error: $PROMPT_FILE not found${NC}"
        exit 1
    fi
    
    # Check for jq
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ Error: jq is required but not installed${NC}"
        echo "  Install with: brew install jq (Mac) or apt install jq (Linux)"
        exit 1
    fi
    
    # Initialize progress.txt if needed
    if [ ! -f "$PROGRESS_FILE" ]; then
        echo "# PDFCraft Build Progress" > $PROGRESS_FILE
        echo "Started: $(date)" >> $PROGRESS_FILE
        echo "" >> $PROGRESS_FILE
    fi
    
    # Initialize agents.md if needed
    if [ ! -f "$AGENTS_FILE" ]; then
        echo "# PDFCraft Codebase Knowledge" > $AGENTS_FILE
        echo "" >> $AGENTS_FILE
    fi
}

run_iteration() {
    local iteration=$1
    
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  📍 Iteration $iteration of $MAX_ITERATIONS${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Get next incomplete story
    NEXT_ID=$(jq -r '.stories[] | select(.passes == false) | .id' $PRD_FILE | head -1)
    NEXT_TITLE=$(jq -r ".stories[] | select(.id == \"$NEXT_ID\") | .title" $PRD_FILE)
    
    if [ -z "$NEXT_ID" ]; then
        echo -e "${GREEN}✅ All stories complete!${NC}"
        return 1
    fi
    
    echo -e "${BLUE}Working on:${NC} $NEXT_ID - $NEXT_TITLE"
    echo ""
    
    # Log iteration start
    echo "" >> $PROGRESS_FILE
    echo "### Iteration $iteration - $NEXT_ID" >> $PROGRESS_FILE
    echo "**Started:** $(date)" >> $PROGRESS_FILE
    echo "**Story:** $NEXT_TITLE" >> $PROGRESS_FILE
    echo "" >> $PROGRESS_FILE
    
    # Run Claude Code
    # NOTE: Replace this with your actual Claude Code invocation
    # This might be:
    #   - claude (if using Claude Code CLI)
    #   - cursor (if using Cursor)
    #   - aider (if using Aider)
    
    echo -e "${YELLOW}🤖 Invoking Claude Code...${NC}"
    echo ""
    
    # Example: Using Claude Code CLI
    # claude --prompt "$(cat $PROMPT_FILE)"
    
    # Example: Using Cursor (would need to be adapted)
    # cursor --apply "$(cat $PROMPT_FILE)"
    
    # For now, we'll just print instructions for manual invocation
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Manual Step Required${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  1. Open Claude Code (or your AI coding tool)"
    echo "  2. Copy the prompt from: $PROMPT_FILE"
    echo "  3. Let it implement: $NEXT_ID - $NEXT_TITLE"
    echo "  4. Verify it updated prd.json, progress.txt, and committed"
    echo ""
    echo "  Press Enter when complete, or 'q' to quit..."
    read -r response
    
    if [ "$response" = "q" ]; then
        echo -e "${YELLOW}Pausing Ralph loop${NC}"
        return 1
    fi
    
    # Verify the story was completed
    STORY_STATUS=$(jq -r ".stories[] | select(.id == \"$NEXT_ID\") | .passes" $PRD_FILE)
    
    if [ "$STORY_STATUS" = "true" ]; then
        echo -e "${GREEN}✅ Story $NEXT_ID completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Story $NEXT_ID not marked complete${NC}"
        echo "  Check if acceptance criteria passed"
    fi
    
    echo ""
    return 0
}

#───────────────────────────────────────────────────────────────────
# Main Script
#───────────────────────────────────────────────────────────────────

# Handle command line arguments
case "$1" in
    --status|-s)
        print_header
        print_status
        show_all_stories
        exit 0
        ;;
    --reset|-r)
        print_header
        reset_stories
        exit 0
        ;;
    --help|-h)
        print_header
        echo "Usage: ./ralph.sh [options] [max_iterations]"
        echo ""
        echo "Options:"
        echo "  --status, -s    Show current story status"
        echo "  --reset, -r     Reset all stories to incomplete"
        echo "  --help, -h      Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./ralph.sh              # Run with default 40 iterations"
        echo "  ./ralph.sh 20           # Run with 20 iterations max"
        echo "  ./ralph.sh --status     # Check progress"
        echo ""
        exit 0
        ;;
esac

# Main execution
print_header
check_requirements
print_status

echo -e "${BLUE}Starting Ralph loop with max $MAX_ITERATIONS iterations${NC}"
echo ""

ITERATION=0
while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    
    if ! run_iteration $ITERATION; then
        break
    fi
    
    # Small delay between iterations
    sleep 1
done

echo ""
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}  🏁 Ralph Session Complete${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
print_status
