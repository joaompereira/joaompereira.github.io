% ********************************************************
% * Algebra Linear e Aplica��es - 2023                   *
% *                                                      *
% *   Professor Jo�o M Pereira                           *
% *                                                      *
% * C�digo de aplica��o - Equa��o do calor em equil�brio *
% *         03/21/2023                                   *
% ********************************************************

% Dimens�o da matriz
N = 20; 

% Pontos do dom�nio (espa�ados igualmente)
x = linspace(0,1,N+2); 

% A � uma matriz tridiagonal com 
% -1, 2, -1 nas diagonais -1, 0 e 1, respectivamente
A = spdiags(repmat([-1,2,-1],N,1),-1:1,N,N);

% b = h^2 f(h i), f � a fun��o seno
b = sin(pi*x(2:end-1)')*(1/(N+1))^2;

% Resolver o sistema (0 nas pontas)
% Internamente, o Matlab leva em considera��o 
% que a matriz � tridiagonal
u = [0; A\b; 0];

% 100 Pontos no dom�nio (espa�ados igualmente)
% Para fazer o plot
x100 = linspace(0,1,100);

plot(x100, sin(pi*x100)/pi^2, x, u, ' +')