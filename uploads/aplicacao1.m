% ********************************************************
% * Algebra Linear e Aplicações - 2023                   *
% *                                                      *
% *   Professor João M Pereira                           *
% *                                                      *
% * Código de aplicação - Equação do calor em equilíbrio *
% *         03/21/2023                                   *
% ********************************************************

% Dimensão da matriz
N = 20; 

% Pontos do domínio (espaçados igualmente)
x = linspace(0,1,N+2); 

% A é uma matriz tridiagonal com 
% -1, 2, -1 nas diagonais -1, 0 e 1, respectivamente
A = spdiags(repmat([-1,2,-1],N,1),-1:1,N,N);

% b = h^2 f(h i), f é a função seno
b = sin(pi*x(2:end-1)')*(1/(N+1))^2;

% Resolver o sistema (0 nas pontas)
% Internamente, o Matlab leva em consideração 
% que a matriz é tridiagonal
u = [0; A\b; 0];

% 100 Pontos no domínio (espaçados igualmente)
% Para fazer o plot
x100 = linspace(0,1,100);

plot(x100, sin(pi*x100)/pi^2, x, u, ' +')