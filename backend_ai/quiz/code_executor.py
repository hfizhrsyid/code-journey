"""
Safe Python code execution with test cases
"""
import sys
import io
import traceback
from typing import Dict, List, Any


def execute_code_with_tests(code: str, test_cases: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Execute user code against test cases
    
    Args:
        code: User's Python code
        test_cases: List of test cases with 'input' and 'expected_output'
        
    Returns:
        {
            'passed': int,
            'failed': int,
            'total': int,
            'results': [{'test_num': 1, 'passed': bool, 'input': str, 'expected': str, 'actual': str, 'error': str}]
        }
    """
    results = []
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        test_input = test_case.get('input', '')
        expected_output = test_case.get('expected_output', '').strip()
        
        try:
            # Redirect stdout to capture print statements
            old_stdout = sys.stdout
            sys.stdout = io.StringIO()
            
            # Create a namespace for code execution
            namespace = {}
            
            # Execute the user's code (defines the function)
            exec(code, namespace)
            
            # Find the function name (first function defined in the code)
            func_name = None
            for name, obj in namespace.items():
                if callable(obj) and not name.startswith('_'):
                    func_name = name
                    break
            
            # If we found a function and there's test input, call it
            if func_name and test_input:
                # Parse test input as Python code and call the function
                try:
                    result = eval(f"{func_name}({test_input})", namespace)
                    # Print the result so it can be captured
                    # Handle None return (function that doesn't return anything)
                    if result is not None:
                        print(result)
                except Exception as call_error:
                    # If eval fails, maybe there's a syntax error in test input
                    print(f"Error calling function: {call_error}")
            elif func_name and not test_input:
                # Call function with no arguments
                try:
                    result = namespace[func_name]()
                    if result is not None:
                        print(result)
                except Exception as call_error:
                    print(f"Error calling function: {call_error}")
            
            # Get the output
            actual_output = sys.stdout.getvalue().strip()
            
            # Restore stdout
            sys.stdout = old_stdout
            
            # Debug: log the outputs
            print(f"Test {i}: Input='{test_input}', Expected='{expected_output}', Actual='{actual_output}'")
            
            # Compare output
            if actual_output == expected_output:
                passed += 1
                results.append({
                    'test_num': i,
                    'passed': True,
                    'input': test_input,
                    'expected': expected_output,
                    'actual': actual_output,
                    'error': None
                })
            else:
                failed += 1
                results.append({
                    'test_num': i,
                    'passed': False,
                    'input': test_input,
                    'expected': expected_output,
                    'actual': actual_output,
                    'error': 'Output mismatch'
                })
                
        except Exception as e:
            # Restore stdout in case of error
            sys.stdout = old_stdout
            failed += 1
            results.append({
                'test_num': i,
                'passed': False,
                'input': test_input,
                'expected': expected_output,
                'actual': '',
                'error': f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
            })
    
    return {
        'passed': passed,
        'failed': failed,
        'total': len(test_cases),
        'results': results,
        'all_passed': passed == len(test_cases)
    }


def execute_simple_code(code: str) -> Dict[str, Any]:
    """
    Execute code without test cases (for testing)
    """
    try:
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()
        
        exec(code, {})
        
        output = sys.stdout.getvalue()
        sys.stdout = old_stdout
        
        return {
            'success': True,
            'output': output,
            'error': None
        }
    except Exception as e:
        sys.stdout = old_stdout
        return {
            'success': False,
            'output': '',
            'error': f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        }
