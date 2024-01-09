clc;
function result = addTwoNumbers(a, b)
    result = a + b;
end

num1 = 5;
num2 = 7;

extensionResult = addTwoNumbers(num1, num2);
disp(['Result from the extension: ' num2str(extensionResult)]);
expectedResult = num1 + num2;

if extensionResult == expectedResult
    disp('Test Passed!');
else
    error('Not only did you break the extension, you broke Octave');
end
