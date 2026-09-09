// ============================================================================
// TOP 10 C# CODING INTERVIEW CHALLENGES & SENIOR ARCHITECTURAL LABS
// Sourced from top GitHub .NET interview repositories and Reddit r/dotnet
// ============================================================================

window.INTERVIEW_CHALLENGES = [
  // --- TOP 10 C# CODING INTERVIEW QUESTIONS ---
  {
    id: "remove-string-duplicates",
    title: "1. Remove Duplicate Characters from String",
    pillar: "coding",
    difficulty: "Medium",
    category: "Top 10 Coding",
    scenario: `In technical screenings, interviewers frequently test string manipulation, memory efficiency, and hash set mechanics with this problem.

**Problem Statement:**
Given a string \`input\`, return a new string with all duplicate characters removed while preserving the original relative order of the first occurrence of each character.

**Constraints:**
- Do NOT use LINQ's \`.Distinct()\` or \`.GroupBy()\`. You must demonstrate manual iteration and data structure usage.
- Must achieve optimal **O(N)** time complexity.
- Handle empty or single-character strings gracefully.
- Case-sensitive (e.g., 'a' and 'A' are distinct).

**Example:**
- Input: \`"banana"\` → Output: \`"ban"\`
- Input: \`"csharp_interview_prep"\` → Output: \`"csharp_intvew"\``,
    initialCode: `public class Solution
{
    // Write an optimal O(N) solution without using LINQ .Distinct()
    public string RemoveDuplicates(string input)
    {
        if (string.IsNullOrEmpty(input) || input.Length == 1)
            return input;

        // TODO: Use a HashSet<char> and StringBuilder to filter duplicates in O(N) time
        return input;
    }
}`,
    tests: [
      {
        name: "Does NOT use LINQ .Distinct() or .GroupBy()",
        validate: (code) => {
          return !/\.Distinct\s*\(/.test(code) && !/\.GroupBy\s*\(/.test(code);
        },
        failureMessage: "Do not use LINQ .Distinct() or .GroupBy(). Implement with a HashSet and StringBuilder."
      },
      {
        name: "Uses HashSet<char> for O(1) character lookup",
        validate: (code) => {
          return /HashSet<char>/.test(code) && /new\s+(?:HashSet<char>|\(\))/.test(code);
        },
        failureMessage: "Declare and instantiate a 'HashSet<char>' to track seen characters in O(1) time."
      },
      {
        name: "Uses StringBuilder to avoid string heap allocations",
        validate: (code) => {
          return /StringBuilder/.test(code) && /\.Append\s*\(/.test(code);
        },
        failureMessage: "Use 'StringBuilder' to construct the result string efficiently."
      },
      {
        name: "Checks if char is already seen using .Add() or .Contains()",
        validate: (code) => {
          return /[\w_]+\.Add\s*\(/.test(code) || /[\w_]+\.Contains\s*\(/.test(code);
        },
        failureMessage: "Check whether the character was previously encountered using 'seen.Add(c)'."
      }
    ],
    hints: [
      "Strings in .NET are immutable reference types. Concatenating characters in a loop using `+` creates O(N^2) garbage collector pressure. Always use `StringBuilder`.",
      "The `HashSet<T>.Add()` method in C# returns `bool`: `true` if the item was added (not seen before), or `false` if it was already present!",
      "Loop through each `char c in input`: if `seen.Add(c)` is true, call `sb.Append(c)`. Return `sb.ToString()`."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N) where N is the length of input string
    // Space Complexity: O(K) where K is the number of unique characters (max O(1) for fixed character set)
    public string RemoveDuplicates(string input)
    {
        if (string.IsNullOrEmpty(input) || input.Length == 1)
            return input;

        var seen = new HashSet<char>();
        var sb = new StringBuilder(input.Length);

        foreach (char c in input)
        {
            // HashSet.Add returns true if the element was added (not duplicate)
            if (seen.Add(c))
            {
                sb.Append(c);
            }
        }

        return sb.ToString();
    }
}`
  },

  {
    id: "valid-palindrome",
    title: "2. Valid Palindrome with Alphanumeric Filtering",
    pillar: "coding",
    difficulty: "Easy-Medium",
    category: "Top 10 Coding",
    scenario: `A classic two-pointer algorithmic question asked across Microsoft, Amazon, and enterprise .NET interviews.

**Problem Statement:**
Given a string \`s\`, return \`true\` if it is a palindrome, considering only alphanumeric characters and ignoring cases. Otherwise, return \`false\`.

**Constraints:**
- Must achieve **O(N)** time and **O(1)** auxiliary space.
- Do NOT allocate a new reversed copy of the string or create arrays of filtered characters.
- Use two pointers (\`left\` and \`right\`) moving inward.

**Example:**
- Input: \`"A man, a plan, a canal: Panama"\` → Output: \`true\`
- Input: \`"race a car"\` → Output: \`false\``,
    initialCode: `public class Solution
{
    // Achieve O(N) time and O(1) auxiliary space using Two-Pointers
    public bool IsPalindrome(string s)
    {
        if (string.IsNullOrEmpty(s)) return true;

        int left = 0;
        int right = s.Length - 1;

        // TODO: Move pointers inward, skipping non-alphanumeric chars, and compare case-insensitively
        return false;
    }
}`,
    tests: [
      {
        name: "Initializes left and right pointers",
        validate: (code) => {
          return /int\s+left\s*=\s*0/.test(code) && /int\s+right\s*=\s*[\w_]+\.Length\s*-\s*1/.test(code);
        },
        failureMessage: "Initialize 'int left = 0;' and 'int right = s.Length - 1;' for the two-pointer scan."
      },
      {
        name: "Uses while loop with condition (left < right)",
        validate: (code) => {
          return /while\s*\(\s*left\s*<\s*right\s*\)/.test(code);
        },
        failureMessage: "Implement the primary two-pointer loop: 'while (left < right)'."
      },
      {
        name: "Uses char.IsLetterOrDigit to skip symbols & whitespace",
        validate: (code) => {
          return /char\.IsLetterOrDigit/.test(code);
        },
        failureMessage: "Use 'char.IsLetterOrDigit' to skip punctuation and whitespace without regex overhead."
      },
      {
        name: "Compares characters using char.ToLower or char.ToUpper",
        validate: (code) => {
          return /char\.(?:ToLowerInvariant|ToLower|ToUpperInvariant|ToUpper)/.test(code);
        },
        failureMessage: "Compare characters case-insensitively using 'char.ToLowerInvariant(s[left])'."
      }
    ],
    hints: [
      "Using `Regex.Replace` allocates new strings on the Gen 0 heap. The senior approach uses `char.IsLetterOrDigit()` directly in a loop for zero extra memory allocations!",
      "While `left < right`, if `!char.IsLetterOrDigit(s[left])`, increment `left++` and continue.",
      "If characters at `left` and `right` do not match when lowercased, immediately return `false`. If the loop finishes, return `true`."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N) single pass
    // Space Complexity: O(1) auxiliary space (zero heap allocations)
    public bool IsPalindrome(string s)
    {
        if (string.IsNullOrEmpty(s)) return true;

        int left = 0;
        int right = s.Length - 1;

        while (left < right)
        {
            // Skip non-alphanumeric characters on the left
            while (left < right && !char.IsLetterOrDigit(s[left]))
            {
                left++;
            }

            // Skip non-alphanumeric characters on the right
            while (left < right && !char.IsLetterOrDigit(s[right]))
            {
                right--;
            }

            // Case-insensitive comparison
            if (char.ToLowerInvariant(s[left]) != char.ToLowerInvariant(s[right]))
            {
                return false;
            }

            left++;
            right--;
        }

        return true;
    }
}`
  },

  {
    id: "reverse-words-sentence",
    title: "3. Reverse Words in a Sentence (In-Place Array)",
    pillar: "coding",
    difficulty: "Medium",
    category: "Top 10 Coding",
    scenario: `Frequently asked to assess understanding of in-place algorithms, index manipulation, and string immutability in C#.

**Problem Statement:**
Given a character array representing a sentence \`char[] s\`, reverse the order of the words in-place without using \`string.Split(' ')\` or creating temporary string arrays.

**Algorithm:**
1. Reverse the entire character array.
2. Reverse each individual word in-place within the reversed array.

**Example:**
- Input: \`['t','h','e',' ','s','k','y',' ','i','s',' ','b','l','u','e']\`
- Output: \`['b','l','u','e',' ','i','s',' ','s','k','y',' ','t','h','e']\``,
    initialCode: `public class Solution
{
    // Reverse the sentence words in-place in O(N) time and O(1) extra space
    public void ReverseWords(char[] s)
    {
        if (s == null || s.Length <= 1) return;

        // Step 1: Reverse the entire array
        // Step 2: Reverse each word bounded by spaces
    }

    private void Reverse(char[] s, int start, int end)
    {
        // Helper to reverse subarray from start to end
    }
}`,
    tests: [
      {
        name: "Does NOT use string.Split or LINQ .Reverse()",
        validate: (code) => {
          return !/\.Split\s*\(/.test(code) && !/Enumerable\.Reverse/.test(code);
        },
        failureMessage: "Do not use string.Split() or LINQ. Implement with an in-place swap helper."
      },
      {
        name: "Implements Reverse helper method with two-pointer swap",
        validate: (code) => {
          return /(?:private|public)\s+void\s+Reverse\s*\(\s*char\[\]\s+[\w_]+,\s*int\s+[\w_]+,\s*int\s+[\w_]+\)/.test(code) &&
                 /while\s*\(\s*[\w_]+\s*<\s*[\w_]+\s*\)/.test(code);
        },
        failureMessage: "Implement a helper 'private void Reverse(char[] s, int start, int end)' with a while loop swapping elements."
      },
      {
        name: "Reverses entire array first",
        validate: (code) => {
          return /Reverse\s*\(\s*s\s*,\s*0\s*,\s*s\.Length\s*-\s*1\s*\)/.test(code);
        },
        failureMessage: "Step 1 must reverse the entire array: 'Reverse(s, 0, s.Length - 1);'."
      },
      {
        name: "Detects word boundaries and reverses each word",
        validate: (code) => {
          return /s\[[\w_]+\]\s*==\s*'\s'/.test(code) || /s\[[\w_]+\]\s*!=\s*'\s'/.test(code);
        },
        failureMessage: "Detect spaces 's[i] == ' '' to isolate and reverse each individual word."
      }
    ],
    hints: [
      "If you reverse the whole array: 'the sky is blue' becomes 'eulb si yks eht'. Notice that all words are in their correct final positions, but their letters are backwards!",
      "All you need to do next is scan through and reverse each individual word between spaces!",
      "A swap between two elements: `char temp = s[start]; s[start] = s[end]; s[end] = temp;`."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N) — two passes over the array
    // Space Complexity: O(1) auxiliary memory (pure in-place mutation)
    public void ReverseWords(char[] s)
    {
        if (s == null || s.Length <= 1) return;

        // Step 1: Reverse the entire character array
        Reverse(s, 0, s.Length - 1);

        // Step 2: Reverse each individual word within the array
        int start = 0;
        for (int end = 0; end <= s.Length; end++)
        {
            // Word boundary is reached at space or end of array
            if (end == s.Length || s[end] == ' ')
            {
                Reverse(s, start, end - 1);
                start = end + 1;
            }
        }
    }

    private void Reverse(char[] s, int start, int end)
    {
        while (start < end)
        {
            char temp = s[start];
            s[start] = s[end];
            s[end] = temp;
            start++;
            end--;
        }
    }
}`
  },

  {
    id: "two-sum",
    title: "4. Two Sum (Optimal One-Pass Hash Map)",
    pillar: "coding",
    difficulty: "Easy",
    category: "Top 10 Coding",
    scenario: `The #1 most frequently encountered coding question in technical history. Interviewers look for immediate transition from the brute-force O(N^2) nested loop to an optimal O(N) one-pass hash map.

**Problem Statement:**
Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

**Constraints:**
- Exactly one valid solution exists.
- You may not use the same element twice.
- Must run in **O(N)** time complexity.

**Example:**
- Input: \`nums = [2, 7, 11, 15], target = 9\` → Output: \`[0, 1]\` (since nums[0] + nums[1] == 9)`,
    initialCode: `public class Solution
{
    // Implement optimal O(N) one-pass hash map solution
    public int[] TwoSum(int[] nums, int target)
    {
        // TODO: Use Dictionary<int, int> to store complement -> index
        return new int[0];
    }
}`,
    tests: [
      {
        name: "Does NOT use nested loops (O(N^2) brute force)",
        validate: (code) => {
          const forMatches = code.match(/for\s*\(/g) || [];
          return forMatches.length <= 1;
        },
        failureMessage: "Do not use nested for loops. Use a Dictionary for O(N) linear time."
      },
      {
        name: "Instantiates Dictionary<int, int> lookup table",
        validate: (code) => {
          return /Dictionary<int,\s*int>/.test(code) && /new\s+(?:Dictionary<int,\s*int>|\(\))/.test(code);
        },
        failureMessage: "Instantiate a 'Dictionary<int, int>' to map number values to their indices."
      },
      {
        name: "Calculates complement = target - nums[i]",
        validate: (code) => {
          return /target\s*-\s*nums\[[\w_]+\]/.test(code);
        },
        failureMessage: "Compute the needed complement: 'int complement = target - nums[i];'."
      },
      {
        name: "Uses TryGetValue or ContainsKey for O(1) lookup",
        validate: (code) => {
          return /TryGetValue/.test(code) || /ContainsKey/.test(code);
        },
        failureMessage: "Check if the complement exists in the dictionary using 'TryGetValue' or 'ContainsKey'."
      }
    ],
    hints: [
      "For every number `x = nums[i]`, what partner number do we need to reach `target`? Answer: `complement = target - x`.",
      "As you iterate through the array, if `map.TryGetValue(complement, out int index)` succeeds, you've found both indices! Return `new int[] { index, i }`.",
      "Otherwise, record `map[nums[i]] = i` and continue."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N) single-pass lookup
    // Space Complexity: O(N) for dictionary storage
    public int[] TwoSum(int[] nums, int target)
    {
        if (nums == null || nums.Length < 2)
            return Array.Empty<int>();

        // Maps number -> index in array
        var map = new Dictionary<int, int>(nums.Length);

        for (int i = 0; i < nums.Length; i++)
        {
            int complement = target - nums[i];

            // If partner number was already seen, return indices immediately
            if (map.TryGetValue(complement, out int complementIndex))
            {
                return new int[] { complementIndex, i };
            }

            // Store current number and its index (handle duplicates safely)
            map[nums[i]] = i;
        }

        return Array.Empty<int>();
    }
}`
  },

  {
    id: "valid-parentheses",
    title: "5. Valid Balanced Parentheses & Brackets",
    pillar: "coding",
    difficulty: "Easy-Medium",
    category: "Top 10 Coding",
    scenario: `A fundamental data structures interview question that verifies proficiency with Stack mechanics (LIFO - Last-In, First-Out).

**Problem Statement:**
Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example:**
- Input: \`"()[]{}"\` → Output: \`true\`
- Input: \`"(]"\` → Output: \`false\`
- Input: \`"([)]"\` → Output: \`false\``,
    initialCode: `public class Solution
{
    // Use Stack<char> to validate bracket nesting in O(N) time
    public bool IsValid(string s)
    {
        if (string.IsNullOrEmpty(s)) return true;
        if (s.Length % 2 != 0) return false; // Odd length cannot be balanced

        // TODO: Use Stack<char> to match opening and closing brackets
        return false;
    }
}`,
    tests: [
      {
        name: "Instantiates Stack<char>",
        validate: (code) => {
          return /Stack<char>/.test(code) && /new\s+(?:Stack<char>|\(\))/.test(code);
        },
        failureMessage: "Instantiate a 'Stack<char>' to track open brackets."
      },
      {
        name: "Pushes opening brackets or expected closing brackets onto stack",
        validate: (code) => {
          return /[\w_]+\.Push\s*\(/.test(code);
        },
        failureMessage: "Push characters onto the stack using 'stack.Push(...)'."
      },
      {
        name: "Pops from stack and checks stack.Count > 0",
        validate: (code) => {
          return /[\w_]+\.Pop\s*\(\)/.test(code) && (/[\w_]+\.Count\s*==\s*0/.test(code) || /[\w_]+\.Count\s*>\s*0/.test(code) || /TryPop/.test(code));
        },
        failureMessage: "Pop from the stack to match closing brackets, guarding against empty stack."
      },
      {
        name: "Returns true only if stack is empty at the end",
        validate: (code) => {
          return /return\s+[\w_]+\.Count\s*==\s*0/.test(code);
        },
        failureMessage: "Ensure that 'stack.Count == 0' is returned to verify no unclosed open brackets remain."
      }
    ],
    hints: [
      "Quick optimization: if `s.Length % 2 != 0`, return `false` immediately because balanced pairs must always have an even length.",
      "Clean pattern: when you see `'('`, push `')'`. When you see `'{'`, push `'}'`. When you see `'['`, push `']'`. Then for any other character, simply check if `stack.Count == 0 || stack.Pop() != c`!",
      "At the very end, return `stack.Count == 0`."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N) single pass through string
    // Space Complexity: O(N) worst-case stack depth
    public bool IsValid(string s)
    {
        if (string.IsNullOrEmpty(s)) return true;
        if (s.Length % 2 != 0) return false;

        var stack = new Stack<char>();

        foreach (char c in s)
        {
            // Push matching closing bracket
            if (c == '(') stack.Push(')');
            else if (c == '{') stack.Push('}');
            else if (c == '[') stack.Push(']');
            // Closing bracket encountered: check top of stack
            else if (stack.Count == 0 || stack.Pop() != c)
            {
                return false;
            }
        }

        // Must have no remaining unclosed brackets
        return stack.Count == 0;
    }
}`
  },

  {
    id: "longest-unique-substring",
    title: "6. Longest Substring Without Repeating Characters",
    pillar: "coding",
    difficulty: "Medium",
    category: "Top 10 Coding",
    scenario: `A classic problem asked by Tier-1 tech companies to test the **Sliding Window** algorithmic pattern.

**Problem Statement:**
Given a string \`s\`, find the length of the longest substring without repeating characters.

**Constraints:**
- Must run in **O(N)** time complexity.
- Space complexity should be bounded by the character set size.

**Example:**
- Input: \`"abcabcbb"\` → Output: \`3\` (The substring is \`"abc"\`)
- Input: \`"bbbbb"\` → Output: \`1\` (The substring is \`"b"\`)
- Input: \`"pwwkew"\` → Output: \`3\` (The substring is \`"wke"\`)`,
    initialCode: `public class Solution
{
    // Sliding Window: O(N) time complexity
    public int LengthOfLongestSubstring(string s)
    {
        if (string.IsNullOrEmpty(s)) return 0;
        if (s.Length == 1) return 1;

        int maxLength = 0;
        int left = 0;

        // TODO: Expand right pointer, jump left pointer on duplicates
        return maxLength;
    }
}`,
    tests: [
      {
        name: "Uses sliding window with left and right pointers",
        validate: (code) => {
          return /for\s*\(\s*int\s+right\s*=\s*0/.test(code) || /int\s+left\s*=/.test(code);
        },
        failureMessage: "Implement a sliding window with 'left' and 'right' index pointers."
      },
      {
        name: "Tracks character last seen index using Dictionary or Array",
        validate: (code) => {
          return /Dictionary<char,\s*int>/.test(code) || /int\[\s*(?:128|256)\s*\]/.test(code);
        },
        failureMessage: "Track the last seen index of each character using a Dictionary<char, int> or int[] array."
      },
      {
        name: "Updates left pointer using Math.Max to prevent moving backwards",
        validate: (code) => {
          return /Math\.Max\s*\(\s*left/.test(code) || /left\s*=\s*Math\.Max/.test(code);
        },
        failureMessage: "When a duplicate is found, advance 'left = Math.Max(left, map[c] + 1);' to prevent moving backwards."
      },
      {
        name: "Calculates window size using Math.Max(maxLength, right - left + 1)",
        validate: (code) => {
          return /Math\.Max\s*\(\s*maxLength,\s*right\s*-\s*left\s*\+\s*1\s*\)/.test(code) ||
                 /maxLength\s*=\s*Math\.Max/.test(code);
        },
        failureMessage: "Update maximum length: 'maxLength = Math.Max(maxLength, right - left + 1);'."
      }
    ],
    hints: [
      "Instead of using a HashSet and moving `left` one step at a time (which takes 2N steps), store the LAST SEEN INDEX of each character in a `Dictionary<char, int>`.",
      "When character `s[right]` was seen at index `lastSeen`, jump `left = Math.Max(left, lastSeen + 1)`. Why `Math.Max`? Because `lastSeen` might be outside your current window!",
      "Window length is `right - left + 1`."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N) — single pass where each character is examined once
    // Space Complexity: O(min(N, M)) where M is the character set size (e.g. 128 for ASCII)
    public int LengthOfLongestSubstring(string s)
    {
        if (string.IsNullOrEmpty(s)) return 0;
        if (s.Length == 1) return 1;

        int maxLength = 0;
        int left = 0;
        var lastSeen = new Dictionary<char, int>();

        for (int right = 0; right < s.Length; right++)
        {
            char current = s[right];

            // If character seen before, move left pointer past its last occurrence
            if (lastSeen.TryGetValue(current, out int previousIndex))
            {
                left = Math.Max(left, previousIndex + 1);
            }

            lastSeen[current] = right;
            maxLength = Math.Max(maxLength, right - left + 1);
        }

        return maxLength;
    }
}`
  },

  {
    id: "merge-sorted-arrays",
    title: "7. Merge Two Sorted Arrays in O(1) Space",
    pillar: "coding",
    difficulty: "Easy-Medium",
    category: "Top 10 Coding",
    scenario: `Tests backward two-pointer pointer mechanics, preventing overwrite of unread elements.

**Problem Statement:**
You are given two integer arrays \`nums1\` and \`nums2\`, sorted in non-decreasing order, and two integers \`m\` and \`n\`, representing the number of elements in \`nums1\` and \`nums2\` respectively.

\`nums1\` has a length of \`m + n\`, where the first \`m\` elements denote the elements that should be merged, and the last \`n\` elements are set to 0 and should be ignored.

Merge \`nums2\` into \`nums1\` as one sorted array **in-place** in **O(M + N)** time and **O(1)** auxiliary space.

**Example:**
- \`nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3\`
- Output: \`nums1 = [1,2,2,3,5,6]\``,
    initialCode: `public class Solution
{
    // Merge nums2 into nums1 from the back in O(M + N) time and O(1) extra memory
    public void Merge(int[] nums1, int m, int[] nums2, int n)
    {
        // Pointers:
        // p1: last valid element in nums1 (m - 1)
        // p2: last element in nums2 (n - 1)
        // p: last write position in nums1 (m + n - 1)
    }
}`,
    tests: [
      {
        name: "Initializes 3 pointers (p1 = m - 1, p2 = n - 1, p = m + n - 1)",
        validate: (code) => {
          return /p1\s*=\s*m\s*-\s*1/.test(code) && /p2\s*=\s*n\s*-\s*1/.test(code) && /p\s*=\s*m\s*\+\s*n\s*-\s*1/.test(code);
        },
        failureMessage: "Initialize 3 backward pointers: 'int p1 = m - 1, p2 = n - 1, p = m + n - 1;'."
      },
      {
        name: "Fills from the back while p2 >= 0",
        validate: (code) => {
          return /while\s*\(\s*p2\s*>=\s*0\s*\)/.test(code);
        },
        failureMessage: "Iterate while 'p2 >= 0' to place all elements from nums2."
      },
      {
        name: "Compares nums1[p1] and nums2[p2] to select largest",
        validate: (code) => {
          return /nums1\[p1\]\s*>\s*nums2\[p2\]/.test(code) || /nums2\[p2\]\s*>\s*nums1\[p1\]/.test(code);
        },
        failureMessage: "Compare 'nums1[p1]' and 'nums2[p2]' to place the larger value at 'nums1[p]'."
      },
      {
        name: "Decrements pointers appropriately",
        validate: (code) => {
          return /p--/.test(code) && (/p1--/.test(code) || /p2--/.test(code));
        },
        failureMessage: "Decrement write pointer 'p--' and corresponding source pointers."
      }
    ],
    hints: [
      "If you fill from the front (`index 0`), you will overwrite valid values in `nums1`. The key senior insight is to fill backwards starting at index `m + n - 1`!",
      "The largest remaining element between `nums1[p1]` and `nums2[p2]` goes to `nums1[p]`.",
      "If `p1 < 0`, you only need to copy remaining elements from `nums2`."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(M + N) — each element inspected at most once
    // Space Complexity: O(1) — in-place modification
    public void Merge(int[] nums1, int m, int[] nums2, int n)
    {
        int p1 = m - 1;         // Pointer for end of initialized nums1
        int p2 = n - 1;         // Pointer for end of nums2
        int p = m + n - 1;      // Write pointer from the back

        // While there are elements to place from nums2
        while (p2 >= 0)
        {
            // If nums1 has elements remaining and its value is larger
            if (p1 >= 0 && nums1[p1] > nums2[p2])
            {
                nums1[p] = nums1[p1];
                p1--;
            }
            else
            {
                nums1[p] = nums2[p2];
                p2--;
            }
            p--;
        }
    }
}`
  },

  {
    id: "group-anagrams",
    title: "8. Group Anagrams",
    pillar: "coding",
    difficulty: "Medium",
    category: "Top 10 Coding",
    scenario: `Frequently used to test string canonicalization, hashing strategies, and Dictionary collection modeling in .NET.

**Problem Statement:**
Given an array of strings \`strs\`, group the anagrams together. You can return the answer in any order.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example:**
- Input: \`["eat","tea","tan","ate","nat","bat"]\`
- Output: \`[["bat"],["nat","tan"],["ate","eat","tea"]]\``,
    initialCode: `public class Solution
{
    // Group anagrams using canonical sorted key or char-frequency key
    public IList<IList<string>> GroupAnagrams(string[] strs)
    {
        if (strs == null || strs.Length == 0)
            return new List<IList<string>>();

        // TODO: Map canonical key -> List<string>
        return new List<IList<string>>();
    }
}`,
    tests: [
      {
        name: "Instantiates Dictionary with List<string> values",
        validate: (code) => {
          return /Dictionary<string,\s*(?:List<string>|IList<string>)>/.test(code);
        },
        failureMessage: "Declare a 'Dictionary<string, List<string>>' to group anagram words by key."
      },
      {
        name: "Canonicalizes word by sorting char array",
        validate: (code) => {
          return /Array\.Sort\s*\(/.test(code) && /new\s+string\s*\(/.test(code);
        },
        failureMessage: "Sort characters: 'char[] chars = s.ToCharArray(); Array.Sort(chars); string key = new string(chars);'."
      },
      {
        name: "Groups matching anagrams into dictionary list",
        validate: (code) => {
          return /TryGetValue/.test(code) || /ContainsKey/.test(code) || /CollectionsMarshal/.test(code);
        },
        failureMessage: "Check if the canonical key exists and add the word to that key's list."
      },
      {
        name: "Returns values collection cast to IList<IList<string>>",
        validate: (code) => {
          return /\.Values/.test(code) && /new\s+List<IList<string>>/.test(code);
        },
        failureMessage: "Return all dictionary values: 'new List<IList<string>>(groups.Values)'."
      }
    ],
    hints: [
      "Two words are anagrams if and only if their sorted strings are identical! For example, `\"eat\"`, `\"tea\"`, and `\"ate\"` all sort to `\"aet\"`.",
      "Convert each word to `char[]`, sort it with `Array.Sort(chars)`, convert back to string `new string(chars)` as the hash key.",
      "Return `new List<IList<string>>(map.Values)`."
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N * K log K) where N is string count, K is max string length
    // Space Complexity: O(N * K) total characters stored in the dictionary
    public IList<IList<string>> GroupAnagrams(string[] strs)
    {
        if (strs == null || strs.Length == 0)
            return new List<IList<string>>();

        var groups = new Dictionary<string, List<string>>();

        foreach (string s in strs)
        {
            // Canonicalize by sorting characters
            char[] chars = s.ToCharArray();
            Array.Sort(chars);
            string key = new string(chars);

            if (!groups.TryGetValue(key, out var list))
            {
                list = new List<string>();
                groups[key] = list;
            }

            list.Add(s);
        }

        return new List<IList<string>>(groups.Values);
    }
}`
  },

  {
    id: "lru-cache",
    title: "9. LRU Cache Implementation (O(1) Get & Put)",
    pillar: "coding",
    difficulty: "Hard",
    category: "Top 10 Coding",
    scenario: `The gold standard senior data structures interview question. Evaluates your ability to combine two data structures (Hash Map + Doubly Linked List) to achieve strict **O(1)** operations.

**Problem Statement:**
Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\`: Initialize the LRU cache with positive size capacity.
- \`int Get(int key)\`: Return the value of the key if it exists, otherwise return \`-1\`. Moving the accessed item to the most-recently-used position.
- \`void Put(int key, int value)\`: Update the value if key exists. Otherwise, add the key-value pair. If keys exceed capacity, evict the least recently used key.

Both \`Get\` and \`Put\` MUST run in **O(1)** average time complexity!`,
    initialCode: `public class LRUCache
{
    // Must achieve O(1) Get and O(1) Put
    private readonly int _capacity;

    public LRUCache(int capacity)
    {
        _capacity = capacity;
    }

    public int Get(int key)
    {
        return -1;
    }

    public void Put(int key, int value)
    {
    }
}`,
    tests: [
      {
        name: "Uses LinkedList and Dictionary for O(1) access and eviction",
        validate: (code) => {
          return /LinkedList<[\w_]+>/.test(code) && /Dictionary<int,\s*LinkedListNode<[\w_]+>>/.test(code);
        },
        failureMessage: "Combine 'LinkedList<CacheItem>' and 'Dictionary<int, LinkedListNode<CacheItem>>' for O(1) operations."
      },
      {
        name: "Get method updates node to most recently used (AddFirst/AddLast)",
        validate: (code) => {
          return /public\s+int\s+Get\s*\(\s*int\s+key\s*\)/.test(code) &&
                 (/Remove\s*\(/.test(code) && (/AddFirst\s*\(/.test(code) || /AddLast\s*\(/.test(code)));
        },
        failureMessage: "On Get(), remove node from current position and move to the front/MRU."
      },
      {
        name: "Put method evicts least recently used node when exceeding capacity",
        validate: (code) => {
          return /_capacity/.test(code) &&
                 (/RemoveLast\s*\(\)/.test(code) || /RemoveFirst\s*\(\)/.test(code)) &&
                 /[\w_]+\.Remove\s*\(/.test(code);
        },
        failureMessage: "When capacity is exceeded, evict the tail LRU node and remove its key from the dictionary."
      },
      {
        name: "Returns -1 when key is not found in Get",
        validate: (code) => {
          return /return\s+-1;/.test(code);
        },
        failureMessage: "Return -1 when key is missing."
      }
    ],
    hints: [
      "A raw Dictionary gives O(1) lookup, but does NOT track chronological access order.",
      "A Doubly Linked List gives O(1) node removal and insertion, but O(N) search.",
      "By storing `LinkedListNode<CacheItem>` as the value in your Dictionary, you get direct pointer access to the node in the linked list, allowing you to remove it and insert it at the head in O(1) time!"
    ],
    solution: `public class LRUCache
{
    private class CacheItem
    {
        public int Key { get; }
        public int Value { get; set; }
        public CacheItem(int k, int v) { Key = k; Value = v; }
    }

    private readonly int _capacity;
    private readonly Dictionary<int, LinkedListNode<CacheItem>> _map;
    private readonly LinkedList<CacheItem> _list;

    // Time Complexity: O(1) for both Get and Put
    // Space Complexity: O(Capacity)
    public LRUCache(int capacity)
    {
        _capacity = capacity;
        _map = new Dictionary<int, LinkedListNode<CacheItem>>(capacity);
        _list = new LinkedList<CacheItem>();
    }

    public int Get(int key)
    {
        if (!_map.TryGetValue(key, out var node))
            return -1;

        // Move accessed node to MRU (head of list)
        _list.Remove(node);
        _list.AddFirst(node);

        return node.Value.Value;
    }

    public void Put(int key, int value)
    {
        if (_map.TryGetValue(key, out var existingNode))
        {
            // Update value and move to MRU
            existingNode.Value.Value = value;
            _list.Remove(existingNode);
            _list.AddFirst(existingNode);
            return;
        }

        // Evict least recently used (tail of list) if at capacity
        if (_map.Count >= _capacity)
        {
            var lruNode = _list.Last;
            if (lruNode != null)
            {
                _map.Remove(lruNode.Value.Key);
                _list.RemoveLast();
            }
        }

        // Insert new item at head
        var newItem = new CacheItem(key, value);
        var newNode = new LinkedListNode<CacheItem>(newItem);
        _list.AddFirst(newNode);
        _map[key] = newNode;
    }
}`
  },

  {
    id: "top-k-frequent",
    title: "10. Top K Frequent Elements (.NET PriorityQueue)",
    pillar: "coding",
    difficulty: "Medium",
    category: "Top 10 Coding",
    scenario: `Tests hash table frequency counting and Heap (Priority Queue) data structure mastery in modern C# (.NET 6/8).

**Problem Statement:**
Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements. You may return the answer in any order.

**Constraints:**
- Must be better than **O(N log N)** (sorting the entire array).
- Optimal complexity is **O(N log K)** using a Min-Heap of size K, or **O(N)** using Bucket Sort.

**Example:**
- Input: \`nums = [1,1,1,2,2,3], k = 2\` → Output: \`[1, 2]\`
- Input: \`nums = [1], k = 1\` → Output: \`[1]\``,
    initialCode: `public class Solution
{
    // Achieve O(N log K) time using PriorityQueue<int, int> (Min-Heap of size K)
    public int[] TopKFrequent(int[] nums, int k)
    {
        if (nums == null || nums.Length == 0 || k <= 0)
            return Array.Empty<int>();

        // Step 1: Count frequencies in Dictionary<int, int>
        // Step 2: Maintain a min-heap of size K using PriorityQueue<int, int>
        return Array.Empty<int>();
    }
}`,
    tests: [
      {
        name: "Counts frequencies using Dictionary<int, int>",
        validate: (code) => {
          return /Dictionary<int,\s*int>/.test(code);
        },
        failureMessage: "Count occurrences of each number using a 'Dictionary<int, int>'."
      },
      {
        name: "Uses PriorityQueue<int, int> or Min-Heap",
        validate: (code) => {
          return /PriorityQueue<int,\s*int>/.test(code);
        },
        failureMessage: "Instantiate a 'PriorityQueue<int, int>' (element, priority/frequency)."
      },
      {
        name: "Maintains heap size <= K using Dequeue",
        validate: (code) => {
          return /Enqueue\s*\(/.test(code) && /Dequeue\s*\(/.test(code);
        },
        failureMessage: "Enqueue elements with frequency as priority, and Dequeue() when count exceeds k."
      },
      {
        name: "Extracts top K results into array",
        validate: (code) => {
          return /int\[k\]/.test(code) || /int\[\s*k\s*\]/.test(code) || /ToArray\(\)/.test(code);
        },
        failureMessage: "Extract the remaining k elements into an int[] array."
      }
    ],
    hints: [
      "Count frequencies in `map = new Dictionary<int, int>()`.",
      "A `PriorityQueue<int, int>` in .NET is a Min-Heap by default. Use the number as the element and its frequency as the priority!",
      "For each entry in the dictionary: `pq.Enqueue(pair.Key, pair.Value)`. If `pq.Count > k`, call `pq.Dequeue()`. The elements remaining in the queue are guaranteed to be the top K!"
    ],
    solution: `public class Solution
{
    // Time Complexity: O(N log K) where N is length of nums and K is heap size
    // Space Complexity: O(N) for dictionary frequency map
    public int[] TopKFrequent(int[] nums, int k)
    {
        if (nums == null || nums.Length == 0 || k <= 0)
            return Array.Empty<int>();

        // Step 1: Build frequency map
        var frequencies = new Dictionary<int, int>();
        foreach (int n in nums)
        {
            frequencies[n] = frequencies.GetValueOrDefault(n, 0) + 1;
        }

        // Step 2: Min-Heap of capacity K + 1 (.NET 6+ PriorityQueue)
        // By default, lower priority numbers are dequeued first (Min-Heap)
        var minHeap = new PriorityQueue<int, int>();

        foreach (var (num, count) in frequencies)
        {
            minHeap.Enqueue(num, count);

            // If heap size exceeds k, drop the element with lowest frequency
            if (minHeap.Count > k)
            {
                minHeap.Dequeue();
            }
        }

        // Step 3: Extract top K elements
        var result = new int[k];
        for (int i = 0; i < k; i++)
        {
            result[i] = minHeap.Dequeue();
        }

        return result;
    }
}`
  },

  // --- SENIOR ARCHITECTURAL BUG LABS ---
  {
    id: "captive-dependency",
    title: "11. Eliminate Captive Dependency in ASP.NET Core DI",
    pillar: "aspnet",
    difficulty: "Senior",
    category: "Architectural Lab",
    scenario: `In a high-throughput ASP.NET Core 8 Web API, you encounter sporadic \`InvalidOperationException: Cannot consume scoped service 'AppDbContext' from singleton 'ReportCacheWorker'\` errors during startup, and concurrent thread access corruption in production when validation is turned off. 

The \`ReportCacheWorker\` is registered as a **Singleton** (hosted background service), but it directly injects **Scoped** \`AppDbContext\` in its constructor. 

Refactor the class to safely resolve the scoped \`AppDbContext\` using \`IServiceScopeFactory\` on demand within \`ProcessPendingReportsAsync\`, preventing captive dependency and lifetime mismatch.`,
    initialCode: `public class ReportCacheWorker : BackgroundService
{
    private readonly ILogger<ReportCacheWorker> _logger;
    // BUG: Captive Dependency! Scoped service injected into Singleton
    private readonly AppDbContext _dbContext;

    public ReportCacheWorker(
        ILogger<ReportCacheWorker> logger,
        AppDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessPendingReportsAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    public async Task ProcessPendingReportsAsync(CancellationToken ct)
    {
        // BUG: Using singleton-captured dbContext across async iterations!
        var pending = await _dbContext.Reports
            .Where(r => !r.IsProcessed)
            .ToListAsync(ct);

        foreach (var report in pending)
        {
            report.IsProcessed = true;
            report.ProcessedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(ct);
    }
}`,
    tests: [
      {
        name: "Injects IServiceScopeFactory in constructor",
        validate: (code) => {
          return /IServiceScopeFactory\s+[\w_]+/.test(code) &&
                 !/public\s+ReportCacheWorker\s*\([^\)]*AppDbContext\s+[\w_]+/.test(code);
        },
        failureMessage: "Remove AppDbContext from constructor and inject 'IServiceScopeFactory' instead."
      },
      {
        name: "Does NOT retain AppDbContext as a singleton field",
        validate: (code) => {
          return !/private\s+(?:readonly\s+)?AppDbContext\s+_\w+;/.test(code);
        },
        failureMessage: "Do not store AppDbContext in a class field on a Singleton background service."
      },
      {
        name: "Creates scope with 'using var scope = ...CreateScope()'",
        validate: (code) => {
          return /using\s+(?:var\s+[\w_]+|IServiceScope\s+[\w_]+)\s*=\s*[\w_]+\.CreateScope\(\)/.test(code) ||
                 /using\s*\(\s*(?:var\s+[\w_]+|IServiceScope\s+[\w_]+)\s*=\s*[\w_]+\.CreateScope\(\)\s*\)/.test(code);
        },
        failureMessage: "Must create an explicit scope using 'using var scope = _scopeFactory.CreateScope();'."
      },
      {
        name: "Resolves AppDbContext from scope.ServiceProvider",
        validate: (code) => {
          return /scope\.ServiceProvider\.GetRequiredService<AppDbContext>\(\)/.test(code) ||
                 /scope\.ServiceProvider\.GetService<AppDbContext>\(\)/.test(code);
        },
        failureMessage: "Resolve AppDbContext using 'scope.ServiceProvider.GetRequiredService<AppDbContext>()'."
      }
    ],
    hints: [
      "In ASP.NET Core, Singletons live for the entire application lifetime. Scoped services (like EF Core DbContext) are meant to live per-request. Injecting a Scoped service into a Singleton creates a 'Captive Dependency', keeping that DbContext alive forever and breaking thread-safety.",
      "Inject 'IServiceScopeFactory' into ReportCacheWorker's constructor, then in 'ProcessPendingReportsAsync', create a temporary scope: 'using var scope = _scopeFactory.CreateScope();'."
    ],
    solution: `public class ReportCacheWorker : BackgroundService
{
    private readonly ILogger<ReportCacheWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public ReportCacheWorker(
        ILogger<ReportCacheWorker> logger,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessPendingReportsAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    public async Task ProcessPendingReportsAsync(CancellationToken ct)
    {
        // Safe scope creation: DbContext is created and disposed per iteration
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pending = await dbContext.Reports
            .Where(r => !r.IsProcessed)
            .ToListAsync(ct);

        foreach (var report in pending)
        {
            report.IsProcessed = true;
            report.ProcessedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);
    }
}`
  },

  {
    id: "eliminate-n-plus-one",
    title: "12. Eliminate N+1 Queries & Cartesian Explosion in EF Core",
    pillar: "sql",
    difficulty: "Senior",
    category: "Architectural Lab",
    scenario: `A critical order history API is causing database CPU spikes and high latency. The endpoint loads 100 Customers, but then generates 100 individual SQL roundtrips in a loop to fetch Orders and line items (N+1 query anti-pattern). Furthermore, tracking 10,000 tracked entities causes major GC Gen 2 pressure.

Refactor the query to:
1. Use \`.AsNoTracking()\` to disable change tracking on read-only DTOs.
2. Use LINQ projection (\`.Select()\`) to flatten the query into a single efficient SQL query.
3. Eliminate the loop and redundant database roundtrips completely.`,
    initialCode: `public async Task<List<CustomerOrderSummaryDto>> GetCustomerOrderSummariesAsync(AppDbContext db, CancellationToken ct)
{
    // BUG: Loading tracked entities and executing N+1 queries in loop!
    var customers = await db.Customers.ToListAsync(ct);
    var results = new List<CustomerOrderSummaryDto>();

    foreach (var c in customers)
    {
        // BUG: N database roundtrips executed inside loop!
        var orders = await db.Orders
            .Where(o => o.CustomerId == c.Id)
            .Include(o => o.Items)
            .ToListAsync(ct);

        results.Add(new CustomerOrderSummaryDto(
            c.Id,
            c.FullName,
            orders.Count,
            orders.SelectMany(o => o.Items).Sum(i => i.Quantity * i.UnitPrice)
        ));
    }

    return results;
}`,
    tests: [
      {
        name: "Uses .AsNoTracking() to bypass EF Change Tracker",
        validate: (code) => {
          return /\.AsNoTracking\(\)/.test(code);
        },
        failureMessage: "Add '.AsNoTracking()' to query read-only DTOs without change tracker memory overhead."
      },
      {
        name: "Uses direct LINQ projection via .Select()",
        validate: (code) => {
          return /\.Select\s*\(\s*c\s*=>\s*new\s+CustomerOrderSummaryDto/.test(code);
        },
        failureMessage: "Use direct LINQ projection '.Select(c => new CustomerOrderSummaryDto(...))'."
      },
      {
        name: "Eliminates foreach loop and multiple roundtrips",
        validate: (code) => {
          return !/foreach\s*\(/.test(code) && !/for\s*\(/.test(code);
        },
        failureMessage: "Eliminate the foreach loop. Project directly from db.Customers."
      },
      {
        name: "Executes single ToListAsync(ct)",
        validate: (code) => {
          const matches = code.match(/ToListAsync/g) || [];
          return matches.length === 1;
        },
        failureMessage: "The entire result must be fetched with a single 'ToListAsync(ct)' call."
      }
    ],
    hints: [
      "Direct LINQ projection (`.Select(c => new Dto(...))`) instructs EF Core to generate an optimized SQL query with GROUP BY and aggregate functions, transferring only the necessary summary columns across the network!",
      "Combine `db.Customers.AsNoTracking().Select(c => new CustomerOrderSummaryDto(...)).ToListAsync(ct)`."
    ],
    solution: `public async Task<List<CustomerOrderSummaryDto>> GetCustomerOrderSummariesAsync(AppDbContext db, CancellationToken ct)
{
    // Single optimized SQL query generated by EF Core projection
    return await db.Customers
        .AsNoTracking()
        .Select(c => new CustomerOrderSummaryDto(
            c.Id,
            c.FullName,
            c.Orders.Count,
            c.Orders.SelectMany(o => o.Items).Sum(i => i.Quantity * i.UnitPrice)
        ))
        .ToListAsync(ct);
}`
  },

  {
    id: "async-deadlock-threadpool",
    title: "13. Resolve Async/Await Deadlock & ThreadPool Starvation",
    pillar: "csharp",
    difficulty: "Senior",
    category: "Architectural Lab",
    scenario: `Under high production load (5,000 req/sec), an ASP.NET Core service suddenly experiences latency spikes, 504 Gateway Timeouts, and ThreadPool starvation.

Thread dump analysis reveals:
1. \`lock (_syncLock)\` is guarding asynchronous HTTP operations.
2. \`.Result\` and \`.GetAwaiter().GetResult()\` are synchronously blocking threads on asynchronous tasks.

Refactor the service to use \`SemaphoreSlim\` with \`await semaphore.WaitAsync(ct)\` in a try/finally block and eliminate all blocking sync-over-async calls.`,
    initialCode: `public class PaymentGatewayClient
{
    private readonly HttpClient _httpClient;
    private readonly object _syncLock = new object();

    public PaymentGatewayClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public PaymentResult ProcessPayment(PaymentRequest request, CancellationToken ct)
    {
        // BUG 1: Cannot await inside a monitor lock!
        // BUG 2: Synchronously blocking thread with .Result causing ThreadPool starvation!
        lock (_syncLock)
        {
            var task = _httpClient.PostAsJsonAsync("https://api.gateway.com/pay", request, ct);
            var response = task.Result; // DEADLOCK / STARVATION HAZARD!

            var contentTask = response.Content.ReadFromJsonAsync<PaymentResult>(cancellationToken: ct);
            return contentTask.GetAwaiter().GetResult();
        }
    }
}`,
    tests: [
      {
        name: "Replaces object lock with SemaphoreSlim",
        validate: (code) => {
          return /SemaphoreSlim\s+[\w_]+\s*=\s*new\s+SemaphoreSlim\s*\(\s*1\s*,\s*1\s*\);/.test(code) &&
                 !/private\s+(?:readonly\s+)?object\s+_syncLock/.test(code);
        },
        failureMessage: "Replace 'object _syncLock' with 'private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);'."
      },
      {
        name: "Uses await semaphore.WaitAsync(ct) in try/finally",
        validate: (code) => {
          return /await\s+[\w_]+\.WaitAsync\s*\(\s*ct\s*\)/.test(code) &&
                 /finally[\s\S]*?[\w_]+\.Release\s*\(\s*\)/.test(code);
        },
        failureMessage: "Must acquire lock via 'await _semaphore.WaitAsync(ct);' and release in a 'finally { _semaphore.Release(); }' block."
      },
      {
        name: "Eliminates all .Result and .GetResult() calls",
        validate: (code) => {
          return !/\.Result\b/.test(code) && !/\.GetResult\(\)/.test(code);
        },
        failureMessage: "Never use .Result or .GetAwaiter().GetResult(). Replace with async/await."
      },
      {
        name: "Awaits HTTP calls asynchronously with CancellationToken",
        validate: (code) => {
          return /await\s+[\w_]+(?:\s*\.\s*|\.)PostAsJsonAsync[\s\S]*?ct/.test(code) &&
                 /await\s+[\w_]+(?:\s*\.\s*|\.)Content(?:\s*\.\s*|\.)ReadFromJsonAsync[\s\S]*?ct/.test(code);
        },
        failureMessage: "Properly await PostAsJsonAsync and ReadFromJsonAsync with cancellation token."
      }
    ],
    hints: [
      "In modern asynchronous C#, the standard pattern for mutual exclusion is `SemaphoreSlim`: `await _semaphore.WaitAsync(ct); try { ... } finally { _semaphore.Release(); }`.",
      "Always propagate `async Task<PaymentResult>` instead of synchronous methods."
    ],
    solution: `public class PaymentGatewayClient
{
    private readonly HttpClient _httpClient;
    private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

    public PaymentGatewayClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(PaymentRequest request, CancellationToken ct)
    {
        // Non-blocking asynchronous acquisition
        await _semaphore.WaitAsync(ct);
        try
        {
            var response = await _httpClient.PostAsJsonAsync("https://api.gateway.com/pay", request, ct);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<PaymentResult>(cancellationToken: ct);
        }
        finally
        {
            _semaphore.Release();
        }
    }
}`
  },

  {
    id: "sargable-sql-refactor",
    title: "14. Refactor Non-SARGable Query to High-Performance Index Seek",
    pillar: "sql",
    difficulty: "Senior",
    category: "Architectural Lab",
    scenario: `A database query on the \`Orders\` table (15,000,000 rows) is running for 14 seconds per execution, causing 100% disk I/O and tempdb contention. 

There is an index on \`Orders(CreatedAt, Status)\`, but the query execution plan shows a **Clustered Index Scan** of all 15 million rows because scalar functions are applied directly to indexed columns in the WHERE clause:
\`WHERE YEAR(o.CreatedAt) = 2024 AND UPPER(o.Status) = 'COMPLETED' AND ISNULL(o.Discount, 0) > 0.05\`

Refactor the query to make it **SARGable** (Search Argument Able) so the SQL query engine can perform a lightning-fast **Index Seek** in <10ms.`,
    initialCode: `-- SLOW NON-SARGABLE QUERY: Causes 15M Row Table Scan
SELECT o.OrderId, o.CustomerId, o.TotalAmount, o.CreatedAt
FROM dbo.Orders o
WHERE YEAR(o.CreatedAt) = 2024
  AND UPPER(o.Status) = 'COMPLETED'
  AND ISNULL(o.Discount, 0) > 0.05;`,
    tests: [
      {
        name: "Uses date range boundary condition (o.CreatedAt >= '2024-01-01' AND o.CreatedAt < '2025-01-01')",
        validate: (code) => {
          return /CreatedAt\s*>=\s*['"]2024-01-01['"]\s+AND\s+[\w.]*CreatedAt\s*<\s*['"]2025-01-01['"]/.test(code) ||
                 /CreatedAt\s*>=\s*['"]20240101['"]\s+AND\s+[\w.]*CreatedAt\s*<\s*['"]20250101['"]/.test(code);
        },
        failureMessage: "Replace YEAR(o.CreatedAt) = 2024 with half-open boundary: o.CreatedAt >= '2024-01-01' AND o.CreatedAt < '2025-01-01'."
      },
      {
        name: "Removes UPPER() function from Status predicate",
        validate: (code) => {
          return !/UPPER\s*\(\s*[\w.]*Status\s*\)/.test(code) && /Status\s*=\s*['"]COMPLETED['"]/.test(code);
        },
        failureMessage: "Remove UPPER(o.Status). Compare column directly: o.Status = 'COMPLETED'."
      },
      {
        name: "Replaces ISNULL(o.Discount, 0) > 0.05 with direct comparison",
        validate: (code) => {
          return !/ISNULL\s*\(\s*[\w.]*Discount/.test(code) && /Discount\s*>\s*0\.05/.test(code);
        },
        failureMessage: "Remove ISNULL(). If o.Discount > 0.05, NULLs are automatically excluded."
      }
    ],
    hints: [
      "When you wrap an indexed column in a function like `YEAR(col)` or `UPPER(col)`, SQL Server cannot use the B-Tree index ordering because it doesn't know the output of the function without evaluating it for every single row in the table!",
      "Use half-open interval for dates: `o.CreatedAt >= '2024-01-01' AND o.CreatedAt < '2025-01-01'`.",
      "SQL Server collation is usually case-insensitive by default. Remove `UPPER()`. For `ISNULL(Discount, 0) > 0.05`, `Discount > 0.05` is inherently NULL-safe."
    ],
    solution: `-- REFACTORED SARGABLE QUERY: Achieves B-Tree Index Seek in <5ms
SELECT o.OrderId, o.CustomerId, o.TotalAmount, o.CreatedAt
FROM dbo.Orders o
WHERE o.CreatedAt >= '2024-01-01' AND o.CreatedAt < '2025-01-01'
  AND o.Status = 'COMPLETED'
  AND o.Discount > 0.05;`
  },

  {
    id: "channel-backpressure",
    title: "15. High-Throughput Producer-Consumer with System.Threading.Channels",
    pillar: "csharp",
    difficulty: "Senior",
    category: "Architectural Lab",
    scenario: `A background telemetry ingestion service uses \`BlockingCollection<TelemetryBatch>\`, which locks OS threads and exhausts memory when producer throughput outpaces consumer database writes (OOM crash under peak load).

Refactor the producer-consumer pipeline using \`System.Threading.Channels\`:
1. Use \`Channel.CreateBounded<TelemetryBatch>(capacity)\` with backpressure.
2. Set \`BoundedChannelFullMode.Wait\` so producers asynchronously yield instead of crashing memory.
3. Consume messages using \`await foreach (var item in _channel.Reader.ReadAllAsync(ct))\`.`,
    initialCode: `public class TelemetryQueue
{
    // BUG: BlockingCollection blocks worker threads and lacks async backpressure
    private readonly BlockingCollection<TelemetryBatch> _queue = new BlockingCollection<TelemetryBatch>(1000);

    public void Enqueue(TelemetryBatch batch)
    {
        // Blocks calling thread!
        _queue.Add(batch);
    }

    public void ProcessQueue(Action<TelemetryBatch> handler, CancellationToken ct)
    {
        // Blocks consumer thread synchronously
        foreach (var batch in _queue.GetConsumingEnumerable(ct))
        {
            handler(batch);
        }
    }
}`,
    tests: [
      {
        name: "Instantiates Bounded Channel with capacity",
        validate: (code) => {
          return /Channel\.CreateBounded<TelemetryBatch>/.test(code);
        },
        failureMessage: "Use 'Channel.CreateBounded<TelemetryBatch>(options)' to enforce memory bounds."
      },
      {
        name: "Configures BoundedChannelFullMode.Wait for backpressure",
        validate: (code) => {
          return /BoundedChannelFullMode\.Wait/.test(code);
        },
        failureMessage: "Set 'FullMode = BoundedChannelFullMode.Wait' to apply non-blocking backpressure."
      },
      {
        name: "Uses await _channel.Writer.WriteAsync(...) for asynchronous enqueue",
        validate: (code) => {
          return /await\s+[\w_]+\.Writer\.WriteAsync\s*\(/.test(code);
        },
        failureMessage: "Enqueue asynchronously with 'await _channel.Writer.WriteAsync(batch, ct);'."
      },
      {
        name: "Consumes with await foreach (... in _channel.Reader.ReadAllAsync())",
        validate: (code) => {
          return /await\s+foreach\s*\([^\)]*in\s+[\w_]+\.Reader\.ReadAllAsync\s*\(/.test(code);
        },
        failureMessage: "Consume batches using 'await foreach (var batch in _channel.Reader.ReadAllAsync(ct))'."
      }
    ],
    hints: [
      "`System.Threading.Channels` is .NET's high-performance, allocation-free, lock-free async producer-consumer primitive.",
      "Configure options: `new BoundedChannelOptions(1000) { FullMode = BoundedChannelFullMode.Wait, SingleReader = false, SingleWriter = false }`.",
      "Consume with `await foreach (var batch in _channel.Reader.ReadAllAsync(ct))`."
    ],
    solution: `public class TelemetryQueue
{
    private readonly Channel<TelemetryBatch> _channel;

    public TelemetryQueue(int capacity = 1000)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = false,
            SingleWriter = false
        };
        _channel = Channel.CreateBounded<TelemetryBatch>(options);
    }

    public async ValueTask EnqueueAsync(TelemetryBatch batch, CancellationToken ct = default)
    {
        // Asynchronously waits if channel is full without blocking any thread
        await _channel.Writer.WriteAsync(batch, ct);
    }

    public async Task ProcessQueueAsync(Func<TelemetryBatch, Task> handler, CancellationToken ct = default)
    {
        // Asynchronously stream batches as they arrive
        await foreach (var batch in _channel.Reader.ReadAllAsync(ct))
        {
            await handler(batch);
        }
    }
}`
  }
];
