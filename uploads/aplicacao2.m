% ********************************************************
% * Algebra Linear e Aplicações - 2023                   *
% *                                                      *
% *   Professor João M Pereira                           *
% *                                                      *
% * Código de aplicação - Mínimos quadráticos            *
% *         04/11/2023                                   *
% ********************************************************

% Número de pontos
N = 50;

% Desvio-padrão do erro
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

% Equações Normais
sol = (A'*A) \ (A'* y);
a_est = sol(2);
b_est = sol(1);

% Plot solução final
pause
plot([0,1],[b_est, a_est + b_est], 'LineWidth', 1.5)
hold off
