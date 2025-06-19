# Manual Testing Script for Semester Functionality

## Test Scenario 1: Independent Data for Each Semester

1. **Start Semester Setup**
   - Open http://localhost:3000
   - Verify "Start of Semester" tab is selected
   - Add course: "CS101"
   - Add custom task: "Prepare syllabus" under "Course Directive"
   - Mark some tasks as complete
   - Verify progress indicators show completion

2. **Switch to End Semester**
   - Click "End of Semester" tab
   - Verify different default tasks appear (Final Grades, Course Evaluation, etc.)
   - Verify course list is empty (independent from start semester)
   - Add course: "CS401"
   - Mark some end-of-semester tasks as complete

3. **Verify Data Persistence**
   - Switch back to "Start of Semester" tab
   - Verify CS101 course is still there
   - Verify start-semester task completions are preserved
   - Verify custom tasks are preserved

4. **Refresh Test**
   - Refresh the browser
   - Verify active semester is remembered
   - Verify all data for both semesters is preserved

## Test Scenario 2: Task Editing Independence

1. **Start Semester Task Editing**
   - Go to "Start of Semester"
   - Click "Edit Tasks"
   - Add/modify tasks
   - Save changes

2. **End Semester Task Editing**
   - Switch to "End of Semester"
   - Click "Edit Tasks"
   - Verify different task structure
   - Add/modify end-semester specific tasks
   - Save changes

3. **Verify Independence**
   - Switch between semesters
   - Verify each has its own task structure
   - Verify changes don't affect the other semester

## Expected Results
- ✅ Each semester maintains independent courses
- ✅ Each semester maintains independent task structures
- ✅ Each semester maintains independent completion status
- ✅ Tab switching is smooth and immediate
- ✅ All data persists across browser refreshes
- ✅ No console errors or infinite render loops
