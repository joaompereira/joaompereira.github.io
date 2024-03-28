% ********************************************************
% * Algebra Linear e Aplica��es - 2023                   *
% *                                                      *
% *   Professor Jo�o M Pereira                           *
% *                                                      *
% * C�digo de aplica��o - M�nimos quadr�ticos            *
% *         04/11/2023                                   *
% ********************************************************

% N�mero de pontos
N = 50;

% Desvio-padr�o do erro
err = 0.05;

% f(x) = a x + b
b = 1;
a = 1/3;

% (x_i, y_i)
x = linspace(0, 1, N)';
y = b + a * x + err * randn(N, 1);

% plot (x_i, y_i)
scatter(x, y, '*','LineWidth', 1.5)
pause
hold on
% plot linha original
plot([0,1],[b, a + b], '--', 'LineWidth', 1.5)

% A
A = [ones(N,1), x];

% Equa��es Normais
sol = (A'*A) \ (A'* y);
a_est = sol(2);
b_est = sol(1);

% Plot solu��o final
pause
plot([0,1],[b_est, a_est + b_est], 'LineWidth', 1.5)
hold off
